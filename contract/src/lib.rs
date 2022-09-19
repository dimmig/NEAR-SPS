use near_contract_standards::fungible_token::receiver::FungibleTokenReceiver;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{TreeMap, UnorderedMap};
use near_sdk::{
    env, json_types::U128, near_bindgen, serde_json, AccountId, BorshStorageKey, Gas,
    PanicOnDefault, PromiseOrValue, PromiseResult,
};
use source::ContractSourceMetadata;

use crate::errors::*;
use crate::ext_interfaces::*;
use crate::types::*;

mod errors;
mod ext_interfaces;
mod on_transfer;
mod source;
mod types;

pub const ONE_YOCTO: u128 = 1;
pub const FT_TRANSFER_TGAS: Gas = Gas(30_000_000_000_000);
pub const RESERVE_TGAS: Gas = Gas(50_000_000_000_000);

#[derive(BorshSerialize, BorshStorageKey)]
pub enum GamesKeys {
    Games,
    GamesWithKey { account_id: AccountId },
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

    pub fn get_contract_metadata(&self) -> ContractSourceMetadata {
        ContractSourceMetadata {
            version: "3334a4164988e1e240ffb87d6388e5d5b28f5a36".to_string(),
            link: "https://github.com/dimmig/NEAR-SPS".to_string(),
        }
    }

    pub(crate) fn create_game(
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
            self.add_game(game.clone());
            self.transfer_tokens_to_winner(game);
        } else {
            game.status = GameStatus::Lose;
            game.assets = amount;

            let id = game.get_id();

            if player_games.contains_key(&id) {
                env::panic_str(ALREADY_EXISTS);
            }

            self.add_game(game);
        }
    }

    pub(crate) fn add_game(&mut self, game: Game) {
        let id = game.get_id();

        let mut player_games =
            self.games
                .get(&game.player_id)
                .unwrap_or(TreeMap::new(GamesKeys::GamesWithKey {
                    account_id: game.player_id.clone(),
                }));

        player_games.insert(&id, &game);

        self.games.insert(&game.player_id, &player_games);
    }

    pub(crate) fn transfer_tokens_to_winner(&mut self, game: Game) {
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

        if !player_games.contains_key(&id) {
            env::panic_str(INVALID_GAME_DATA)
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
                .send_tokens_to_player_callback(),
            );
    }

    #[private]
    pub fn send_tokens_to_player_callback(&mut self) {
        assert_eq!(
            env::promise_results_count(),
            1,
            "{}",
            "Not correct promise result count"
        );

        match env::promise_result(0) {
            PromiseResult::Failed => env::log_str("Failed transfer tokens to player"),
            PromiseResult::Successful(_) => {
                env::log_str("Tokens successfully transfered to player")
            }
            _ => unreachable!(),
        }
    }

    pub fn get_games(
        &self,
        player_id: &AccountId,
        from_index: i64,
        limit: i64,
    ) -> Option<Vec<GameView>> {
        let games = self.games.get(&player_id);

        if games.is_none() {
            return None;
        }

        let mut games = games.unwrap().to_vec();
        games.sort_by(|a, b| {
            b.1.date
                .parse::<i128>()
                .unwrap()
                .cmp(&a.1.date.parse().unwrap())
        });

        let mut res = vec![];

        for i in from_index..std::cmp::min(from_index + limit, games.len() as i64) {
            let (id, game) = games.get(i as usize).expect(DOESNT_EXIST);
            res.push(GameView {
                id: id.to_owned(),
                status: game.status.clone(),
                date: game.date.clone(),
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
            status: GameStatus::Win,
            date: String::from("July 28, 13:43"),
            assets: U128(10),
        };

        contract.add_game(game_action);

        assert!(contract.get_games(&player_id, 0, 5).unwrap().len() == 1);
    }

    #[test]
    fn test_getting_games() {
        let context = get_context(accounts(2));
        testing_env!(context.build());

        let mut contract = build_contract();

        let player_id: AccountId = "rapy.testnet".parse().unwrap();

        let game_action = Game {
            player_id: player_id.clone(),
            status: GameStatus::Win,
            date: String::from("11111111"),
            assets: U128(15),
        };

        contract.add_game(game_action.clone());

        assert_eq!(
            contract.get_games(&player_id, 0, 5).unwrap()[0].assets,
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
            status: GameStatus::Win,
            date: String::from("July 28, 13:43"),
            assets: U128(15),
        };
        contract.add_game(game_action);

        let invalid_game_action = Game {
            player_id: player_id.clone(),
            status: GameStatus::Win,
            date: String::from("July 28, 14:43"), //changed date
            assets: U128(15),
        };
        contract.transfer_tokens_to_winner(invalid_game_action)
    }

    #[test]
    fn test_sorting_games() {
        let context = get_context(accounts(1));
        testing_env!(context.build());

        let mut contract = build_contract();

        let player_id: AccountId = "rapy.testnet".parse().unwrap();

        let first_game = Game {
            player_id: player_id.clone(),
            status: GameStatus::Win,
            date: String::from("11111111"),
            assets: U128(15),
        };

        let second_game = Game {
            player_id: player_id.clone(),
            status: GameStatus::Win,
            date: String::from("22222222"),
            assets: U128(15),
        };

        let third_game = Game {
            player_id: player_id.clone(),
            status: GameStatus::Win,
            date: String::from("33333333"),
            assets: U128(15),
        };

        contract.add_game(first_game.clone());
        contract.add_game(second_game);
        contract.add_game(third_game.clone());

        let games = contract.get_games(&player_id, 0, 5).unwrap();

        assert_eq!(games[0].date, third_game.date);

        assert_eq!(games[2].date, first_game.date)
    }
}
