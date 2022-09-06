use near_contract_standards::fungible_token::receiver::FungibleTokenReceiver;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{TreeMap, UnorderedMap};
use near_sdk::{
    env, json_types::U128, serde_json, BorshStorageKey, Gas, PanicOnDefault, PromiseOrValue,
};
use near_sdk::{near_bindgen, AccountId, PromiseResult};

use crate::ext_interfaces::*;
use crate::types::*;
mod ext_interfaces;
mod on_transfer;
mod types;

pub const ONE_YOCTO: u128 = 1;
pub const FT_TRANSFER_TGAS: Gas = Gas(30_000_000_000_000);
pub const RESERVE_TGAS: Gas = Gas(50_000_000_000_000);

#[derive(BorshSerialize, BorshStorageKey)]
pub enum GamesKeys {
    Games,
    GamesWithKey { game_id: AccountId },
    FinishedGames,
    FinishedGamesWithKey { game_id: AccountId },
}

#[near_bindgen]
#[derive(PanicOnDefault, BorshDeserialize, BorshSerialize)]
pub struct Games {
    version: u8,
    token_address: AccountId,
    games: UnorderedMap<AccountId, TreeMap<GameId, Game>>,
    finished_games: UnorderedMap<AccountId, TreeMap<GameId, Game>>,
}

#[near_bindgen]
impl Games {
    #[init]
    pub fn new(version: u8, token_address: AccountId) -> Self {
        Self {
            version,
            token_address,
            games: UnorderedMap::new(GamesKeys::Games),
            finished_games: UnorderedMap::new(GamesKeys::FinishedGames),
        }
    }

    pub fn check_winner(
        &mut self,
        user_item: i8,
        params: Assets,
        amount: U128,
        sender_id: AccountId,
    ) {
        let rand = *env::random_seed().get(0).unwrap();

        env::log_str(&format!("RANDOM {}", rand));

        if (rand <= 85 && user_item == 1)
            || (rand > 85 && rand <= 170 && user_item == 2)
            || (rand > 170 && rand < 255 && user_item == 3)
        {
            let game = Game {
                player_id: sender_id,
                status: GameStatus::Win,
                date: params.date,
                assets: U128(amount.0 * 2),
            };

            self.add_game(game);
        } else {
            let game = Game {
                player_id: sender_id,
                status: GameStatus::Lose,
                date: params.date,
                assets: amount,
            };

            self.add_game(game);
        }
    }

    pub fn add_game(&mut self, game: Game) {
        let id = game.get_id();

        let mut player_games =
            self.games
                .get(&game.player_id)
                .unwrap_or(TreeMap::new(GamesKeys::GamesWithKey {
                    game_id: game.player_id.clone(),
                }));

        let mut finished_games = self
            .finished_games
            .get(&game.player_id)
            .unwrap_or(TreeMap::new(GamesKeys::FinishedGamesWithKey {
                game_id: game.player_id.clone(),
            }));

        if player_games.contains_key(&id) || finished_games.contains_key(&id) {
            env::panic_str("Game already exists")
        };

        if game.status == GameStatus::Win {
            finished_games.insert(&id, &game);
            self.finished_games.insert(&game.player_id, &finished_games);
        }

        player_games.insert(&id, &game);

        self.games.insert(&game.player_id, &player_games);
    }

    pub fn transfer_tokens_to_winner(&mut self, game: Game) {
        let player_games =
            self.games
                .get(&game.player_id)
                .unwrap_or(TreeMap::new(GamesKeys::GamesWithKey {
                    game_id: game.player_id.clone(),
                }));

        let finished_games = self
            .finished_games
            .get(&game.player_id)
            .unwrap_or(TreeMap::new(GamesKeys::FinishedGamesWithKey {
                game_id: game.player_id.clone(),
            }));
        let id = game.get_id();

        if player_games.contains_key(&id) && !finished_games.contains_key(&id) {
            env::panic_str("Game already exists")
        }

        if !player_games.contains_key(&id) {
            env::panic_str("Game is invalid")
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
                let mut finished_games = self
                    .finished_games
                    .get(&player_id)
                    .unwrap_or_else(|| env::panic_str("Internal error"));

                finished_games.remove(&id);

                if finished_games.len() == 0 {
                    self.finished_games.remove(&player_id);
                } else {
                    self.finished_games.insert(&player_id, &finished_games);
                }

                env::log_str("Tokens successfully transfered to player")
            }
            _ => unreachable!(),
        }
    }
    pub fn get_games(&self, player_id: &AccountId) -> Option<Vec<GameView>> {
        let games = self.games.get(&player_id);

        if games.is_none() {
            return None;
        }

        let games = games.unwrap();

        let mut res = vec![];

        for game in games.iter() {
            res.push(GameView {
                id: game.0,
                status: game.1.status,
                date: game.1.date,
                assets: game.1.assets,
            })
        }
        Some(res)
    }

    pub fn get_finished_games(&self, player_id: &AccountId) -> Option<Vec<GameView>> {
        let games = self.finished_games.get(&player_id);

        if games.is_none() {
            return None;
        }

        let games = games.unwrap();

        let mut res = vec![];

        for game in games.iter() {
            res.push(GameView {
                id: game.0,
                status: game.1.status,
                date: game.1.date,
                assets: game.1.assets,
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

    #[test]
    fn test_adding_game() {
        let context = get_context(accounts(1));
        testing_env!(context.build());

        let mut contract = Games {
            version: 1,
            token_address: AccountId::new_unchecked(String::from("wusn.testnet")),
            games: UnorderedMap::new(GamesKeys::Games),
            finished_games: UnorderedMap::new(GamesKeys::FinishedGames),
        };

        let player_id: AccountId = "rapy.testnet".parse().unwrap();

        let game_action = Game {
            player_id: player_id.clone(),
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

        let mut contract = Games {
            version: 1,
            token_address: AccountId::new_unchecked(String::from("wusn.testnet")),
            games: UnorderedMap::new(GamesKeys::Games),
            finished_games: UnorderedMap::new(GamesKeys::FinishedGames),
        };

        let player_id: AccountId = "rapy.testnet".parse().unwrap();

        let game_action = Game {
            player_id: player_id.clone(),
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
    fn test_getting_finished_games() {
        let context = get_context(accounts(1));
        testing_env!(context.build());

        let mut contract = Games {
            version: 1,
            token_address: AccountId::new_unchecked(String::from("wusn.testnet")),
            games: UnorderedMap::new(GamesKeys::Games),
            finished_games: UnorderedMap::new(GamesKeys::FinishedGames),
        };

        let player_id: AccountId = "rapy.testnet".parse().unwrap();

        let lose_game_action = Game {
            player_id: player_id.clone(),
            status: GameStatus::Lose,
            date: String::from("July 28, 13:43"),
            assets: U128(15),
        };

        let win_game_action = Game {
            player_id: player_id.clone(),
            status: GameStatus::Win,
            date: String::from("July 30, 15:28"),
            assets: U128(15),
        };
        contract.add_game(lose_game_action);

        assert!(contract.get_finished_games(&player_id).is_none());
        assert_eq!(contract.get_games(&player_id).unwrap().len(), 1);

        contract.add_game(win_game_action);

        assert_eq!(contract.get_finished_games(&player_id).unwrap().len(), 1);
        assert_eq!(contract.get_games(&player_id).unwrap().len(), 2);
    }

    #[test]
    #[should_panic(expected = "Game is invalid")]
    fn test_getting_rewards_from_invalid_game() {
        let context = get_context(accounts(1));
        testing_env!(context.build());

        let mut contract = Games {
            version: 1,
            token_address: AccountId::new_unchecked(String::from("wusn.testnet")),
            games: UnorderedMap::new(GamesKeys::Games),
            finished_games: UnorderedMap::new(GamesKeys::FinishedGames),
        };
        let player_id: AccountId = "rapy.testnet".parse().unwrap();

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
        contract.transfer_tokens_to_winner(invalid_game_action);
    }

    #[test]
    #[should_panic(expected = "Game already exists")]
    fn test_adding_existing_game() {
        let context = get_context(accounts(1));
        testing_env!(context.build());

        let mut contract = Games {
            version: 1,
            token_address: AccountId::new_unchecked(String::from("wusn.testnet")),
            games: UnorderedMap::new(GamesKeys::Games),
            finished_games: UnorderedMap::new(GamesKeys::FinishedGames),
        };
        let player_id: AccountId = "rapy.testnet".parse().unwrap();

        let game_action = Game {
            player_id: player_id.clone(),
            status: GameStatus::Win,
            date: String::from("July 28, 13:43"),
            assets: U128(15),
        };
        contract.add_game(game_action.clone());
        contract.add_game(game_action)
    }
}
