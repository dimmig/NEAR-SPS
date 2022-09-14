use near_contract_standards::fungible_token::receiver::FungibleTokenReceiver;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{TreeMap, UnorderedMap};
use near_sdk::{
    env, json_types::U128, near_bindgen, serde_json, AccountId, BorshStorageKey, Gas,
    PanicOnDefault, PromiseOrValue, PromiseResult,
};

use crate::errors::*;
use crate::ext_interfaces::*;
use crate::types::*;

mod errors;
mod ext_interfaces;
mod on_transfer;
mod types;

pub const ONE_YOCTO: u128 = 1;
pub const FT_TRANSFER_TGAS: Gas = Gas(30_000_000_000_000);
pub const RESERVE_TGAS: Gas = Gas(50_000_000_000_000);

#[derive(BorshSerialize, BorshStorageKey)]
pub enum GamesKeys {
    Games,
    GamesWithKey { account_id: AccountId },
    FinishedGames,
    FinishedGamesWithKey { account_id: AccountId },
}

#[near_bindgen]
#[derive(PanicOnDefault, BorshDeserialize, BorshSerialize)]
pub struct Games {
    version: u8,
    token_address: AccountId,
    games: UnorderedMap<AccountId, TreeMap<GameId, Game>>,
}

#[near_bindgen]
impl Games {
    // init contract state
    #[init]
    pub fn new(version: u8, token_address: AccountId) -> Self {
        Self {
            version,
            token_address,
            games: UnorderedMap::new(GamesKeys::Games),
        }
    }

    pub fn create_game(
        &mut self,
        user_item: i8,
        params: GameInfo,
        amount: U128,
        sender_id: AccountId,
    ) {
        let player_games =
            self.games
                .get(&sender_id)
                .unwrap_or(TreeMap::new(GamesKeys::GamesWithKey {
                    account_id: sender_id.clone(),
                }));

        let rand = *env::random_seed().get(0).unwrap(); // random number from current block

        let mut game = Game {
            player_id: sender_id,
            payed: false,
            status: GameStatus::Win,
            date: params.date,
            assets: U128(amount.0 * 2),
        };

        let id = game.get_id();

        if player_games.contains_key(&id) {
            env::panic_str(ALREADY_EXISTS);
        }

        if (rand <= 85 && user_item == 1)
            || (rand > 85 && rand <= 170 && user_item == 2)
            || (rand > 170 && rand < 255 && user_item == 3)
        {
            self.add_game(game);
        } else {
            game.payed = true;
            game.status = GameStatus::Lose;
            game.assets = amount;

            let id = game.get_id();

            if player_games.contains_key(&id) {
                env::panic_str(ALREADY_EXISTS);
            }

            self.add_game(game);
        }
    }

    pub fn add_game(&mut self, game: Game) {
        let id = game.get_id();

        let mut player_games =
            self.games
                .get(&game.player_id)
                .unwrap_or(TreeMap::new(GamesKeys::GamesWithKey {
                    account_id: game.player_id.clone(),
                }));

        if player_games.contains_key(&id) {
            env::panic_str(ALREADY_EXISTS)
        };

        player_games.insert(&id, &game);

        self.games.insert(&game.player_id, &player_games);
    }

    pub fn transfer_tokens_to_winner(&mut self, game: Game) {
        let signer_account_id = env::signer_account_id();

        // check if signer == player_id
        if signer_account_id != game.player_id {
            env::panic_str(SIGNER_ACCOUNT_IS_INVALID);
        }

        let player_games =
            self.games
                .get(&game.player_id)
                .unwrap_or(TreeMap::new(GamesKeys::GamesWithKey {
                    account_id: game.player_id.clone(),
                }));

        let id = game.get_id();

        if game.payed {
            env::panic_str(INVALID_PAYED_STATUS)
        }

        if !player_games.contains_key(&id) {
            env::panic_str(INVALID_GAME_DATA)
        }


        let current_game = player_games.get(&id).unwrap();       
        
        if current_game.payed && !game.payed {
            env::panic_str(ALREADY_EXISTS);
        }

        let gas_for_next_callback =
            env::prepaid_gas() - env::used_gas() - FT_TRANSFER_TGAS - RESERVE_TGAS;

        ft_token::ext(self.token_address.clone())
            .with_attached_deposit(ONE_YOCTO)
            .with_static_gas(FT_TRANSFER_TGAS)
            .ft_transfer(game.player_id.clone(), game.assets, "".to_string())
            .then(
                ext_callback::ext(AccountId::new_unchecked(String::from(
                    env::current_account_id(),
                )))
                .with_static_gas(gas_for_next_callback)
                .send_tokens_to_player_callback(game.player_id, id),
            );
    }

    #[private]
    pub fn send_tokens_to_player_callback(&mut self, player_id: AccountId, id: GameId) {
        assert_eq!(
            env::promise_results_count(),
            1,
            "{}",
            "Not correct promise result count"
        );

        match env::promise_result(0) {
            PromiseResult::Failed => env::log_str("Failed transfer tokens to player"),
            PromiseResult::Successful(_) => {
                let mut games = self
                    .games
                    .get(&player_id)
                    .unwrap_or_else(|| env::panic_str(INTERNAL_ERR));

                let mut game = games
                    .get(&id)
                    .unwrap_or_else(|| env::panic_str(DOESNT_EXIST));

                game.payed = true; // changed payed status

                games.insert(&id, &game);

                self.games.insert(&player_id, &games);

                env::log_str("Tokens successfully transfered to player")
            }
            _ => unreachable!(),
        }
    }

    // get all games
    pub fn get_games(&self, player_id: &AccountId) -> Option<Vec<GameView>> {
        let games = self.games.get(&player_id);

        if games.is_none() {
            return None;
        }

        let games = games.unwrap();

        let mut res = vec![];

        for (game_id, game) in games.iter() {
            res.push(GameView {
                id: game_id,
                status: game.status,
                payed: game.payed,
                date: game.date,
                assets: game.assets,
            })
        }
        Some(res)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::accounts;
    use near_sdk::{test_utils::VMContextBuilder, testing_env};

    fn get_context(predecessor_account_id: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(accounts(0))
            .signer_account_id(predecessor_account_id.clone())
            .predecessor_account_id(predecessor_account_id);
        builder
    }

    fn build_contract() -> Games {
        Games::new(1, AccountId::new_unchecked(String::from("wusn.testnet")))
    }

    #[test]
    fn test_adding_game() {
        let context = get_context(accounts(1));
        testing_env!(context.build());

        let mut contract = build_contract();

        let player_id: AccountId = "rapy.testnet".parse().unwrap();

        let game_action = Game {
            player_id: player_id.clone(),
            payed: false,
            status: GameStatus::Win,
            date: String::from("July 28, 13:43"),
            assets: U128(10),
        };

        contract.add_game(game_action);

        assert!(contract.get_games(&player_id).unwrap().len() == 1);
    }

    #[test]
    fn test_getting_games() {
        let context = get_context(accounts(2));
        testing_env!(context.build());

        let mut contract = build_contract();

        let player_id: AccountId = "rapy.testnet".parse().unwrap();

        let game_action = Game {
            player_id: player_id.clone(),
            payed: false,
            status: GameStatus::Win,
            date: String::from("July 28, 13:43"),
            assets: U128(15),
        };

        contract.add_game(game_action.clone());

        assert_eq!(
            contract.get_games(&player_id).unwrap()[0].assets,
            game_action.assets
        )
    }

    #[test]
    #[should_panic(expected = "Game data is invalid")]
    fn test_getting_rewards_from_invalid_game() {
        let mut contract = build_contract();

        let player_id: AccountId = "rapy.testnet".parse().unwrap();

        let context = get_context(player_id.clone());
        testing_env!(context.build());

        env::log_str(&format!("Signer id {}", env::signer_account_id()));

        let game_action = Game {
            player_id: player_id.clone(),
            payed: false,
            status: GameStatus::Win,
            date: String::from("July 28, 13:43"),
            assets: U128(15),
        };
        contract.add_game(game_action);

        let invalid_game_action = Game {
            player_id: player_id.clone(),
            payed: false,
            status: GameStatus::Win,
            date: String::from("July 28, 14:43"), //changed date
            assets: U128(15),
        };
        contract.transfer_tokens_to_winner(invalid_game_action)
    }

    #[test]
    #[should_panic(expected = "Game already exists")]
    fn test_adding_existing_game() {
        let context = get_context(accounts(1));
        testing_env!(context.build());

        let mut contract = build_contract();

        let player_id: AccountId = "rapy.testnet".parse().unwrap();

        let game_action = Game {
            player_id: player_id.clone(),
            payed: false,
            status: GameStatus::Win,
            date: String::from("July 28, 13:43"),
            assets: U128(15),
        };
        contract.add_game(game_action.clone());
        contract.add_game(game_action)
    }
}
