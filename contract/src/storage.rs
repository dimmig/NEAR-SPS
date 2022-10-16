use crate::*;
use near_contract_standards::storage_management::{
    StorageBalance, StorageBalanceBounds, StorageManagement,
};
use near_sdk::{assert_one_yocto, log, Promise};

#[near_bindgen]
impl StorageManagement for Games {
    #[payable]
    fn storage_deposit(
        &mut self,
        account_id: Option<AccountId>,
        registration_only: Option<bool>,
    ) -> StorageBalance {
        let amount = env::attached_deposit();

        let account = account_id.unwrap_or_else(|| env::predecessor_account_id());
        let registration_only = registration_only.unwrap_or(false);
        let min_balance = self.storage_balance_bounds().min.0;

        let already_registered = self.accounts.contains_key(&account);

        if amount < min_balance && !already_registered {
            env::panic_str(ERR6_DEPOSIT_LESS_THAN_MIN_STORAGE);
        };

        if registration_only {
            if already_registered {
                log!("ACCOUNT_ALREDY_REGISTERED");
                if amount > 0 {
                    Promise::new(env::predecessor_account_id()).transfer(amount);
                }
            } else {
                self.internal_register_account(&account, amount);
                let refund = amount - min_balance;
                if refund > 0 {
                    Promise::new(env::predecessor_account_id()).transfer(refund);
                }
            }
        } else {
            self.internal_register_account(&account, amount);
        }

        self.storage_balance_of(account.try_into().unwrap())
            .unwrap()
    }

    #[payable]
    fn storage_withdraw(
        &mut self,
        amount: Option<U128>,
    ) -> near_contract_standards::storage_management::StorageBalance {
        assert_one_yocto();
        let account_id = env::predecessor_account_id();
        let amount = amount.unwrap_or(U128(0)).0;
        let withdraw_amount = self.internal_storage_withdraw(&account_id, amount);
        Promise::new(account_id.clone()).transfer(withdraw_amount);

        self.storage_balance_of(account_id.try_into().unwrap())
            .unwrap()
    }

    #[allow(unused_variables)]
    #[payable]
    fn storage_unregister(&mut self, force: Option<bool>) -> bool {
        assert_one_yocto();
        let account_id = env::predecessor_account_id();
        if let Some(account_deposit) = self.internal_get_account(&account_id) {
            self.accounts.remove(&account_id);
            Promise::new(account_id.clone()).transfer(account_deposit.near_amount);
            true
        } else {
            false
        }
    }

    fn storage_balance_bounds(&self) -> StorageBalanceBounds {
        StorageBalanceBounds {
            min: Account::min_storage_usage().into(),
            max: None,
        }
    }

    fn storage_balance_of(&self, account_id: AccountId) -> Option<StorageBalance> {
        self.internal_get_account(&account_id)
            .map(|acc| StorageBalance {
                total: U128(acc.near_amount),
                available: U128(acc.storage_available()),
            })
    }
}
