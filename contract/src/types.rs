use std::{
    collections::hash_map::DefaultHasher,
    hash::{Hash, Hasher},
};

use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    json_types::U128,
    serde::{Deserialize, Serialize},
    AccountId,
};

#[derive(
    Serialize, Deserialize, BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq, Hash,
)]
#[serde(crate = "near_sdk::serde")]
pub enum GameStatus {
    Win,
    Lose,
}

#[derive(Serialize, Deserialize, BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub struct Assets {
    pub item_number: i8,
    pub date: String,
}

#[derive(Serialize, Deserialize, BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub struct Game {
    pub player_id: AccountId,
    pub status: GameStatus,
    pub date: String,
    pub assets: U128,
}

#[derive(Serialize, Deserialize, BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub struct GameView {
    pub id: GameId,
    pub status: GameStatus,
    pub date: String,
    pub assets: U128,
}

impl Hash for Game {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.player_id.hash(state);
        self.status.hash(state);
        self.date.hash(state);
        self.assets.0.hash(state);
    }
}

impl Game {
    pub fn get_id(&self) -> GameId {
        let mut hasher = DefaultHasher::new();
        self.hash(&mut hasher);
        let hash = hasher.finish();

        hash.to_string()
    }
}

pub type GameId = String;
