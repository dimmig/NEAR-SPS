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
mod types;

pub const ONE_YOCTO: u128 = 1;
pub const FT_TRANSFER_TGAS: Gas = Gas(30_000_000_000_000);

#[derive(BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
    Games,
    GamesWithKey { game_id: AccountId },
    Assets,
}

#[near_bindgen]
#[derive(PanicOnDefault, BorshDeserialize, BorshSerialize)]
pub struct Storage {
    version: u8,
    games: UnorderedMap<AccountId, TreeMap<GameId, Game>>,
    assets: UnorderedMap<AccountId, U128>,
}

#[near_bindgen]
impl FungibleTokenReceiver for Storage {
    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        let token = env::predecessor_account_id();
        env::log_str(&format!(
            "Transfered {:?} {} from {}",
            amount, token, sender_id
        ));

        if msg.is_empty() {
            return PromiseOrValue::Value(amount);
        } else {
            let message = serde_json::from_str::<Assets>(&msg).expect("Wrong message format");
            self.assets.insert(&message.player_id, &message.assets);

            return PromiseOrValue::Value(U128(0));
        }
    }
}

#[near_bindgen]
impl Storage {
    #[init]
    pub fn new(version: u8) -> Self {
        Self {
            version,
            games: UnorderedMap::new(StorageKey::Games),
            assets: UnorderedMap::new(StorageKey::Assets),
        }
    }

    pub fn add_game(&mut self, game: String) {
        let game = serde_json::from_str::<Game>(&game).expect("Wrong game format");

        let id = game.get_id();

        let mut player_games =
            self.games
                .get(&game.player_id)
                .unwrap_or(TreeMap::new(StorageKey::GamesWithKey {
                    game_id: game.player_id.clone(),
                }));

        if player_games.contains_key(&id) {
            env::panic_str("Game already exists")
        };

        if game.status == String::from("Win") {
            ft_token::ext(AccountId::new_unchecked(String::from(
                env::current_account_id(),
            )))
            .with_attached_deposit(ONE_YOCTO)
            .with_static_gas(FT_TRANSFER_TGAS)
            .ft_transfer(game.player_id.clone(), game.assets, "".to_string())
            .then(
                ext_callback::ext(AccountId::new_unchecked(String::from(
                    env::current_account_id(),
                )))
                .send_tokens_to_player_callback(),
            );
        }

        player_games.insert(&id, &game);
        self.games.insert(&game.player_id, &player_games);
        self.assets.remove(&game.player_id);
    }

    #[private]
    pub fn send_tokens_to_player_callback(&self) {
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

    pub fn get_user_assets(&self, player_id: AccountId) -> Option<U128> {
        let user_assets = self.assets.get(&player_id);
        if user_assets.is_none() {
            return None;
        }
        user_assets
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::{test_utils::VMContextBuilder, testing_env};

    #[test]
    fn test_adding_game() {
        let mut contract = Storage {
            version: 1,
            games: UnorderedMap::new(StorageKey::Games),
            assets: UnorderedMap::new(StorageKey::Assets),
        };

        let mut builder = VMContextBuilder::new();
        testing_env!(builder
            .storage_usage(env::storage_usage())
            .attached_deposit(0)
            .predecessor_account_id(AccountId::new_unchecked(String::from("dimag.testnet")))
            .build());

        let player_id: AccountId = "rapy.testnet".parse().unwrap();

        let game_action = Game {
            player_id: player_id.clone(),
            status: String::from("Win"),
            date: String::from("July 28, 13:43"),
            assets: U128(10),
        };

        let game_action = serde_json::to_string::<Game>(&game_action).expect("Wrong game format");

        contract.add_game(game_action);

        assert!(contract.get_games(&player_id).unwrap().len() == 1);
        env::log_str(&format!(
            "Games for {}: {:?}",
            player_id.clone(),
            contract.get_games(&player_id)
        ))
    }

    #[test]
    fn test_getting_games() {
        let mut contract = Storage {
            version: 1,
            games: UnorderedMap::new(StorageKey::Games),
            assets: UnorderedMap::new(StorageKey::Assets),
        };

        let mut builder = VMContextBuilder::new();
        testing_env!(builder
            .storage_usage(env::storage_usage())
            .attached_deposit(0)
            .predecessor_account_id(AccountId::new_unchecked(String::from("dimag.testnet")))
            .build());

        let player_id: AccountId = "rapy.testnet".parse().unwrap();

        let games = contract.get_games(&player_id);
        if games.is_none() {
            let game_action = Game {
                player_id: player_id.clone(),
                status: String::from("Win"),
                date: String::from("July 28, 13:43"),
                assets: U128(15),
            };

            let game_action =
                serde_json::to_string::<Game>(&game_action).expect("Wrong game format");

            contract.add_game(game_action);
            env::log_str(&format!(
                "First game created for user {}, {:?}",
                player_id,
                contract.get_games(&player_id)
            ))
        } else {
            env::log_str(&format!("GAMES: {:?}", games))
        };
    }
}
