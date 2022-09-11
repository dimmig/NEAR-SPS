use crate::{
    env, near_bindgen, serde_json, AccountId, FungibleTokenReceiver, GameInfo, Games, GamesExt,
    PromiseOrValue, U128, errors::INVALID_TOKEN,
};

#[near_bindgen]
impl FungibleTokenReceiver for Games {
    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        let token = env::predecessor_account_id();

        if token != self.token_address {
            env::panic_str(INVALID_TOKEN);
        }

        env::log_str(&format!(
            "Transfered {:?} {} from {}",
            amount, token, sender_id
        ));

        if msg.is_empty() {
            return PromiseOrValue::Value(amount);
        } else {
            let params = serde_json::from_str::<GameInfo>(&msg).expect("Wrong params format");

            let user_item = params.item_number;

            self.check_winner(user_item, params, amount, sender_id);

            return PromiseOrValue::Value(U128(0));
        }
    }
}
