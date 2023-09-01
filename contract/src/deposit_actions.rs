use crate::errors::{ERR8_INSUFFICIENT_STORAGE, ERR9_ACC_NOT_REGISTERED, ERR10_NO_STORAGE_THAT_CAN_WITHDRAW, ERR11_STORAGE_WITHDRAW_TOO_MUCH};
use crate::types::{Game, GameId};
use crate::Games;
use near_sdk::collections::{TreeMap, UnorderedMap};
use near_sdk::{borsh, env, AccountId, BorshStorageKey};
use near_sdk::{
    borsh::{BorshDeserialize, BorshSerialize},
    Balance, StorageUsage,
};

const U128_STORAGE: StorageUsage = 16;
const U64_STORAGE: StorageUsage = 8;
const VERSION: StorageUsage = 1;
const ACC_ID_STORAGE: StorageUsage = 64;
const ACC_ID_AS_KEY_STORAGE: StorageUsage = ACC_ID_STORAGE + 4;
const KEY_PREFIX_ACC: StorageUsage = 64;
const ACC_ID_AS_CLT_KEY_STORAGE: StorageUsage = ACC_ID_AS_KEY_STORAGE + 1;

pub const INIT_ACCOUNT_STORAGE: StorageUsage = ACC_ID_AS_CLT_KEY_STORAGE // Games struct accounts
    + U128_STORAGE // Account struct near_amount
    + U64_STORAGE; // Account struct storage used

#[derive(BorshSerialize, BorshStorageKey)]
pub enum AccountKeys {
    Games { account_id: AccountId },
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Account {
    pub near_amount: Balance,
    pub games: UnorderedMap<AccountId, TreeMap<GameId, Game>>,
    pub storage_used: StorageUsage,
}

impl Account {
    pub fn new(account_id: &AccountId) -> Self {
        Account {
            near_amount: 0,
            games: UnorderedMap::new(AccountKeys::Games {
                account_id: account_id.clone(),
            }),
            storage_used: 0,
        }
    }

    pub fn storage_usage(&self) -> Balance {
        (INIT_ACCOUNT_STORAGE
            + VERSION // games version
            + self.games.len() as u64 * (KEY_PREFIX_ACC + ACC_ID_AS_KEY_STORAGE + U128_STORAGE) // games storage
            + ACC_ID_STORAGE) as u128 // tokenId account
            * env::storage_byte_cost()
    }

    pub fn assert_storage_usage(&self) {
        env::log_str(&format!("NEAR AMOUNT: {}", env::storage_usage()));
        assert!(
            self.storage_usage() <= self.near_amount,
            "{}",
            ERR8_INSUFFICIENT_STORAGE
        );
    }

    pub fn storage_available(&self) -> Balance {
        let usage = self.storage_usage();
        if self.near_amount > usage {
            self.near_amount - usage
        } else {
            0
        }
    }

    pub fn min_storage_usage() -> Balance {
        INIT_ACCOUNT_STORAGE as Balance * env::storage_byte_cost()
    }
}

impl Games {
    pub fn internal_get_account(&self, account_id: &AccountId) -> Option<Account> {
        self.accounts.get(account_id)
    }

    pub fn internal_unwrap_or_default_account(&self, account_id: &AccountId) -> Account {
        self.internal_get_account(account_id)
            .unwrap_or_else(|| Account::new(account_id))
    }

    pub fn internal_save_account(&mut self, account_id: &AccountId, account: Account) {
        account.assert_storage_usage();
        self.accounts.insert(&account_id, &account.into());
    }

    pub(crate) fn internal_register_account(&mut self, account_id: &AccountId, amount: Balance) {
        let mut account = self.internal_unwrap_or_default_account(&account_id);
        account.near_amount += amount;
        self.internal_save_account(&account_id, account);
    }

    pub fn internal_unwrap_account(&self, account_id: &AccountId) -> Account {
        self.internal_get_account(account_id)
            .expect(ERR9_ACC_NOT_REGISTERED)
    }

    pub(crate) fn internal_storage_withdraw(&mut self, account_id: &AccountId, amount: Balance) -> u128 {
        let mut account = self.internal_unwrap_account(&account_id);
        let available = account.storage_available();
        assert!(available > 0, "{}", ERR10_NO_STORAGE_THAT_CAN_WITHDRAW);
        let mut withdraw_amount = amount;
        if amount == 0 {
            withdraw_amount = available;
        }
        assert!(withdraw_amount <= available, "{}", ERR11_STORAGE_WITHDRAW_TOO_MUCH);
        account.near_amount -= withdraw_amount;
        self.internal_save_account(&account_id, account);
        withdraw_amount
    }
}

