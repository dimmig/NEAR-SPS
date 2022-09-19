use crate::{near_bindgen, Games, GamesExt};
use near_sdk::serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
/// Contract metadata structure
pub struct ContractSourceMetadata {
    pub version: String,
    pub link: String,
}

/// Minimum Viable Interface
pub trait ContractSourceMetadataTrait {
    fn contract_source_metadata(&self) -> ContractSourceMetadata;
}

/// Implementation of the view function
#[near_bindgen]
impl ContractSourceMetadataTrait for Games {
    fn contract_source_metadata(&self) -> ContractSourceMetadata {
        self.get_contract_metadata()
    }
}
