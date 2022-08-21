# Aptos-Move-Dapp



## Contract

合约文件

```rust
module MyCounterAddr::MyCounter {
    use std::signer;

    struct Counter has key, store {
        value:u64,
    }

    public fun init(account: &signer){
        move_to(account, Counter{value:0});
    }

    public fun incr(account: &signer) acquires Counter {
        let counter = borrow_global_mut<Counter>(signer::address_of(account));
        counter.value = counter.value + 1;
    }

    public entry fun init_counter(account: signer){
        Self::init(&account)
    }

    public entry fun incr_counter(account: signer)  acquires Counter {
        Self::incr(&account)
    }
}
```

## typescript-sdk-demo

调用demo

```shell
aptos move compile --package-dir contract/my-counter

# 我们需要把`my-counter/build/Examples/bytecode_modules/message.mv` 文件copy到 `aptos-core/developer-docs-site/static/examples/typescript-sdk-demo`下。

cp MyCounter.mv aptos-core/developer-docs-site/static/examples/typescript-sdk-demo

cd typescript-sdk-demo

yarn install

yarn my_counter MyCounter.mv


```

