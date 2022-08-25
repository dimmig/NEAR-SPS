use near_sdk::json_types::U128;
use near_sdk::{ext_contract, AccountId, PromiseError, PromiseOrValue};

#[ext_contract(ft_token)]
pub trait FtToken {
    fn ft_transfer(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128>;
    fn ft_balance_of(&self, account_id: AccountId) -> U128;
    fn ft_total_supply(&self) -> U128;
}

#[ext_contract(ext_callback)]
pub trait ExtCallback {
    fn send_tokens_to_player_callback(
        &self,
        #[callback_result] call_result: Result<PromiseOrValue<U128>, PromiseError>,
    );
}
