[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

# What's this software for?

**_precedence_ brings secure blockchain-powered traceability features to your already existing legacy information system!**

**_precedence_** is the first open source ledger allowing non blockchain specialist to put in place a transparent, immutable, and cryptographically verifiable transaction log with a minimum effort and fully integrated to their existing database or file system.

**_precedence_** is compliant with multiple data sources:
- file system
- SQL databases
- noSQL databases
- stream processing

By connecting your data source to **_precedence_** you automatically get:
- proof-of-existence on every data connected;
- proof-of-ownership compliant with your PKI;
- automatic versioning system for every pieces of information.

All these features allow you bring secure blockchain-powered traceability features to your legacy information system.

**_precedence_** is agnostic to the data type considered and can be use to bring immutable and undeniable traceability to every data that you already operate in your information system. Your system is most likely already compliant and there is no need to apply modification to it to start using **_precedence_**.

**_precedence_** is edited by [**_inBlocks_**](https://precedence.inblocks.io) so you can rely on us for hosting the solution for you, supporting you during the deployment and providing you a very strong SLA.

In the following:
- "fingerprint" means "hexadecimal string format fo the hash computed with SHA-256 algorithm";
- "obfuscated fingerprint of <VALUE>" means fingerprint of "<SEED> <VALUE>".

# Quick Start

## Prerequisites

- a [Redis](https://redis.io) version 5+ instance. If you don't have one, you can launch a container that will host a redis instance (not part of a cluster, not replicated, not scalable so not production-compliant). To do so you can run one of the following ways:

    - without persistence
    ```bash
    docker run --rm --name redis -p 6379:6379 \
        redis:alpine redis-server --appendonly no --save ""
    ```

    - with persistence, detached in background
    ```bash
    docker run -d --name redis -p 6379:6379 \
        -v $HOME/precedence-redis:/data \
        redis:alpine redis-server --appendonly yes --appendfsync always
    # remove container
    docker rm -f redis
    # remove data
    rm -rf $HOME/precedence-redis
    ```

- If you don't use [Docker](https://docs.docker.com): [Node.js](https://nodejs.org) version 8+ and [npm](https://www.npmjs.com) version 5+.

## Run the REST API

- From npm (coming soon)

- From [Docker](https://hub.docker.com/r/inblocks/precedence)
  ```bash
  # usage
  docker run --rm inblocks/precedence --help
  # run
  docker run --rm --name precedence --link redis -p 9000:9000 inblocks/precedence --redis redis:6379
  ```

- From [GitHub sources](https://github.com/inblocks/precedence)
  ```bash
  git clone https://github.com/inblocks/precedence.git
  cd precedence
  for module in api cli common core; do
      echo "$module"
      (cd "$module" && npm i)
  done
  for module in api cli; do
    (cd "$module" && npm link)
  done
  # usage
  precedence-api --help
  # run
  precedence-api
  ```

# First commands

Make sure the `api` environment variable is the API endpoint you want to use.

```bash
api="http://localhost:9000"
```

## Record API calls

To create a first record you can use the following command. By default the data is not stored in **_precedence_**, the only data-related information stored is its fingerprint.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true" -d "value 1"
```

You will find below a response example.

```json
{
  "took": 22,
  "status": 201,
  "data": {
    "provable": {
      "seed": "d0b73b5a384b3267a43a2ac621b096fe8d571ffd33c8bd65df2ec5a83558cd71",
      "id": "81f9f6d8c593325e641e467386e06d050611306f1c3039eb70cd7a3ad8cd29ef",
      "data": "155440510976041de5f5c02b50b64aa967344d6a3a6274324175eb38e7de9b0d",
      "chains": {},
      "previous": []
    },
    "seed": "346db7f705a2d7ca323d81e40461f034d8427ade9aa5db4ddad9536ce4849dd8",
    "hash": "65da867639080176b5998c77219e2745474aa518a04268522467322f06fbd9d9",
    "timestamp": 1560373650141,
    "chains": {}
  }
}
```

For sure you need some explanation about the returned JSON response:
- `took` is the number of millisecond this request needed to be processed at server-side;
- `status` is the HTTP status code;
- `data` contains every piece of information related to the data you provided;
  - `provable` contains the information that you will be able to prove using **_precedence_**;
    - `seed` is the fingerprint of the root `seed`;
    - `id` is the record identifier;
    - `data` is the obfuscated fingerprint of the fingerprint of the data you provided;
    - `chains` is the root `chains` but where keys and values are the obfuscated fingerprint of their original value;
    - `previous` is the list of the record identifiers that are directly linked to this record;
  - `seed` is the random data used for obfuscation;
  - `hash` is the fingerprint of the `provable` object;
  - `timestamp` is the record creation time (EPOCH millisecond);
  - `chains` is the map of relation between a chain and its last record identifier.

We can check that:
- the fingerprint of `seed` value is equal to `provable.seed` value:
```bash
echo -n '346db7f705a2d7ca323d81e40461f034d8427ade9aa5db4ddad9536ce4849dd8 346db7f705a2d7ca323d81e40461f034d8427ade9aa5db4ddad9536ce4849dd8' | sha256sum
```
- the obfuscated fingerprint of the data is equal to `provable.data` value:
```bash
echo -n "346db7f705a2d7ca323d81e40461f034d8427ade9aa5db4ddad9536ce4849dd8 $(echo -n 'value 1' | sha256sum | cut -d' ' -f1)" | sha256sum
```

---

Let's create another record with the `store=true` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```

```json
{
  "took": 7,
  "status": 201,
  "data": {
    "provable": {
      "seed": "e93772f255044cccebd7c47b7e9479b1628a3627d432790ac0e872197c991845",
      "id": "7e595b7c9476421b84fd91a7eec39f0ae1325e4b3e493d3220003e8eb9d4217c",
      "data": "6b60e9cfba76e7b28708f437a7412ef77826697d772ccfc1fe442e32836dbeb3",
      "chains": {},
      "previous": []
    },
    "seed": "999c028fca48506fd31b6ef7cda35e9ce799b8bb942d57892ef40db26f11abd7",
    "hash": "e0a44d3c544c8895dacc7c32952766ee4db44122af955826e45c9486639ef5e4",
    "timestamp": 1560373705467,
    "chains": {},
    "data": "dmFsdWUgMg=="
  }
}
```

In the response you can see that the data you have sent has been persisted in **_precedence_** in the `data` field using base64 encoding.

To decode the data you can run:

```bash
echo "dmFsdWUgMg==" | base64 --decode
```

---

Let's create the same data again.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```
```json
{
  "took": 7,
  "status": 201,
  "data": {
    "provable": {
      "seed": "4ee8fa296f736f20041bde6b338554a20316631f3d2895cc79fe5da262a5b2d8",
      "id": "d389d9f452e9534983ec89c12d8b1bc2915db02cd1c96a8413ca8795a56e5089",
      "data": "bed18c4ec3452c062c59b5c3d2979ca06b697d25c7100afa41b1d1264036414d",
      "chains": {},
      "previous": []
    },
    "seed": "847e73d88d63b084ab8f8bf4181d7b90ddcbeabce54e0a33248232e849ea54d2",
    "hash": "e0a44d3c544c8895dacc7c32952766ee4db44122af955826e45c9486639ef5e4",
    "timestamp": 1560373723348,
    "chains": {},
    "data": "dmFsdWUgMg=="
  }
}
```

All the values of the `provable` object are different from the previous one, even with the same data value. This is made possible by using the `seed` in the hashing process. This way the `provable` fields are 100% obfuscated and can not lead to data leaking.

---

It is also possible to provide the fingerprint of the data with the `hash` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&hash=085a57ddb929d1a2853aad31940d6e718918762b8db43f299e86fe732d13d6b9" -d "value 4"
```

```json
{
  "took": 5,
  "status": 201,
  "data": {
    "provable": {
      "seed": "c9cee4fd76d890349bb1c09b6a3150a76a065545503d1d7e0a23ae209f3c9a96",
      "id": "76245897ef25926ece022d8451aa215cbfb2ace62a6df73b1c5a7561b6515bed",
      "data": "0e089c3545aea208ba4934d9bdbebd23d1da5778f7efb1476bd884e639e81974",
      "chains": {},
      "previous": []
    },
    "seed": "fc2a2983984ba02a5015f25591e6b57a93fc86d28b6e9928ef01d1f17b8586fb",
    "hash": "085a57ddb929d1a2853aad31940d6e718918762b8db43f299e86fe732d13d6b9",
    "timestamp": 1560373739130,
    "chains": {}
  }
}
```

By doing so the received data fingerprint is compared to the provided one to make sure that the received data has not be altered by the network.

---

You can specify an identifier for your record. This identifier must be unique and so can not be attached to any other record.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true&id=E518B4BB-2668-4ED7-B9E3-E63803BCAC93" -d "value 5"
```

```json
{
  "took": 6,
  "status": 201,
  "data": {
    "provable": {
      "seed": "a684bd8273881f14fa5f36540682e4ce5c326f2d2dcf995f242d968022ee9e80",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "5363ca0c1a13da2141b1bea4de7ef624ef6ed5ea39a23c762261eff9579d4b61",
      "chains": {},
      "previous": []
    },
    "seed": "aa04330d9bac40cecee658ec89152d7e3fad38027872d9581ad36361ffef38b4",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "timestamp": 1560373752327,
    "chains": {},
    "data": "dmFsdWUgNQ=="
  }
}
```

The returned identifier is the fingerprint of the identifier you provided.

If you try to create a new record with the same identifier you will get an error.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=E518B4BB-2668-4ED7-B9E3-E63803BCAC93" -d "value 6"
```

```json
{
  "took": 6,
  "status": 409,
  "error": 3,
  "message": "Record \"3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4\" already exists"
}
```

---

To read a record you can use its identifier.

```bash
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 4,
  "status": 200,
  "data": {
    "provable": {
      "seed": "a684bd8273881f14fa5f36540682e4ce5c326f2d2dcf995f242d968022ee9e80",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "5363ca0c1a13da2141b1bea4de7ef624ef6ed5ea39a23c762261eff9579d4b61",
      "chains": {},
      "previous": []
    },
    "seed": "aa04330d9bac40cecee658ec89152d7e3fad38027872d9581ad36361ffef38b4",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "timestamp": 1560373752327,
    "chains": {},
    "data": "dmFsdWUgNQ==",
    "block": null
  }
}
```

The record is not part of a block so the `block` value is `null`. To create a new block you can run the following command. To know more about block management check the dedicated `block` documentation section below.

```bash
curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 66,
  "status": 201,
  "data": {
    "root": "352d90d9612d70b7fee93c12157ea67bf4f89ebac7978803c8a231fc8f92e818",
    "index": 0,
    "timestamp": "1560373806691",
    "count": 5,
    "previous": null
  }
}
```

The block is created, you can now get the record again and retrieve additional information.

```bash
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 22,
  "status": 200,
  "data": {
    "provable": {
      "seed": "a684bd8273881f14fa5f36540682e4ce5c326f2d2dcf995f242d968022ee9e80",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "5363ca0c1a13da2141b1bea4de7ef624ef6ed5ea39a23c762261eff9579d4b61",
      "chains": {},
      "previous": []
    },
    "seed": "aa04330d9bac40cecee658ec89152d7e3fad38027872d9581ad36361ffef38b4",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "timestamp": 1560373752327,
    "chains": {},
    "data": "dmFsdWUgNQ==",
    "block": {
      "root": "352d90d9612d70b7fee93c12157ea67bf4f89ebac7978803c8a231fc8f92e818",
      "proof": [
        "f891808080a00e15e328bb923203e195326bccbfde2662bbcb0c01080784798661d0fe1d9c9b808080a05dd73a20a7b9fab83e556e8eb62f0d72a5b7dd2eb0c41b0f66a95d1a3ac2523fa0bef7df42ad6b1522a3b23d184548cdc2f3267c922433582e965b5039a6a52d6080808080a01188b324b2494a47efd571f782b6595b302e639924b6e09c3c42e382322f2e83808080",
        "f842a03a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a0de07be6a7e5a2221086e7ceddf963886301fd623809a1f2650b9bf848cd61e05"
      ]
    }
  }
}
```

The returned document contains information related to the block the record belongs to:
- `root` is the block root hash that contains this record;
- `proof` is an array that contains the agnostic proof-of-existence of this record in the block.

To check the proof, see the dedicated open-source project [precedence-proof](https://github.com/inblocks/precedence-proof).

---

You can delete the data that is stored in the record. The record itself can not be deleted because it would cause chain inconsistency, same thing for the hash of the data, but the data itself is not required to keep the chain consistent.

```bash
curl -XDELETE "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 2,
  "status": 200,
  "data": 7
}
```

The record data has been deleted releasing `7` bytes, let's retrieve this record again.

```bash
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 13,
  "status": 200,
  "data": {
    "provable": {
      "seed": "a684bd8273881f14fa5f36540682e4ce5c326f2d2dcf995f242d968022ee9e80",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "5363ca0c1a13da2141b1bea4de7ef624ef6ed5ea39a23c762261eff9579d4b61",
      "chains": {},
      "previous": []
    },
    "seed": "aa04330d9bac40cecee658ec89152d7e3fad38027872d9581ad36361ffef38b4",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "timestamp": 1560373752327,
    "chains": {},
    "block": {
      "root": "352d90d9612d70b7fee93c12157ea67bf4f89ebac7978803c8a231fc8f92e818",
      "proof": [
        "f891808080a00e15e328bb923203e195326bccbfde2662bbcb0c01080784798661d0fe1d9c9b808080a05dd73a20a7b9fab83e556e8eb62f0d72a5b7dd2eb0c41b0f66a95d1a3ac2523fa0bef7df42ad6b1522a3b23d184548cdc2f3267c922433582e965b5039a6a52d6080808080a01188b324b2494a47efd571f782b6595b302e639924b6e09c3c42e382322f2e83808080",
        "f842a03a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a0de07be6a7e5a2221086e7ceddf963886301fd623809a1f2650b9bf848cd61e05"
      ]
    }
  }
}
```

The original `data` value has been removed.

---

To create a record as a new state of an existing record you should use the `previous` parameter. It allows you to link you records with each other.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=61E51581-7763-4486-BF04-35045DC7A0D3&store=true&previous=3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4" -d "value 6"
```

```json
{
  "took": 5,
  "status": 201,
  "data": {
    "provable": {
      "seed": "16954b6dbb1f328c6377320f0c689b6c395e98e8e4d5ef0649fbd82569c4a63d",
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "data": "fcf67135dd0a94af96c05203c37e560b18c9cdfc20849b6c699690f627e470c0",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "seed": "e9708f68e3f3d50a427fc92cc82e8a4e264f6997bb8a576009193c1a6832e6ac",
    "hash": "5b193ff1cf8ac2f1aabe5fe7de85debb29e8f337bc89b135a590c1073800cf80",
    "timestamp": 1560374126359,
    "chains": {},
    "data": "dmFsdWUgNg=="
  }
}
```

The `previous` field contains the parameter you provided. This parameter must be the identifier that was returned at creation time, you can not use your own identifier to link your records. If you want to link your record based on a label that you control, use the chain parameter (this is explain in the [chain](#chain-api-calls) section below).

## Chain API calls

The chain API calls have been designed to facilitate the record insertion and the creation of links (using the `previous` field) between those records.

To insert a record in the **_precedence_** system by using the chain method you need to use the `chain` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=4FF6B617-F1CF-4F10-A314-4C7733A9DB7F&chain=chain1" -d "value 7"
```

```json
{
  "took": 24,
  "status": 201,
  "data": {
    "provable": {
      "seed": "7aa8feeba28bd87002c5e50750d7088c3de25dace11d8e861a5692b5eea1182d",
      "id": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951",
      "data": "01ca7990e05fdfb571e53e468bc28b59b75672df7ff0ed22c88a0d22e28b3543",
      "chains": {
        "e47d9c68f02724b568e714512e56b75aa938b4f670d64afc126d7de8126c801c": null
      },
      "previous": []
    },
    "seed": "52f18456b0dfd4c79eb5a9d7f5dbdd66199e5f0326f58525f21444c30464a5e3",
    "hash": "ed914881e913845413125b682876d976b9eab7335980726ddc59f785beb4d5ad",
    "timestamp": 1560374153803,
    "chains": {
      "chain1": null
    }
  }
}
```

The field `chains` contains information about the chain state at insertion time. In this scenario the chain `chain1` was never used before so this newly created record is the first and the last record of this chain. Because there was no record in this chain the value set in `chain.chain1` is `null`. When the chain exists, the inserted record is appended behind the last record of the chain specified in the parameter `chain`. In the same time, and in a atomic way, the newly inserted record become the last record of the chain and can be refered to using the `chain1` label.

Let's insert a second record using this `chain1` label.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=2B6C83EF-474D-4A15-B1D5-A1EC7E8226CF&chain=chain1&store=true" -d "value 8"
```

```json
{
  "took": 6,
  "status": 201,
  "data": {
    "provable": {
      "seed": "59b8340f83b9791856714baab006c2cdf1e673b80de6abe6ce1cad302f930dfa",
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "data": "b6cdad2ab703a2b537340c9872823f2a62947ed927bd7b81858aeb2afdc64100",
      "chains": {
        "19a8a09fc8e27789103252a15a85090f6aaccb30bb3369f30e42e726a91a3afd": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "aee5ef43aa31a7e4a76e3a59758c2fa2e17ee1fee433512093764c65af581cf9",
    "hash": "1bb1c73103ef6ae888ab45afa617f8ec63f21bf959a284363d7a83055ac4f87d",
    "timestamp": 1560374165362,
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    },
    "data": "dmFsdWUgOA=="
  }
}
```

The field `chains` contains the key `chain1` whose value is the record identifier of the previously inserted record. The record has been appended at the end of the chain and the label `chain1` now refers to the newly inserted record. This information is provable because it is part of the record definition. The key stored in `provable.chains` has been obfuscated to avoid any data leak. `chains.chain1` can be removed by deleting the entire chain.

We can check that:
- the obfuscated fingerprint of `chain1` is equal to `19a8a09fc8e27789103252a15a85090f6aaccb30bb3369f30e42e726a91a3afd`:
```bash
echo -n "aee5ef43aa31a7e4a76e3a59758c2fa2e17ee1fee433512093764c65af581cf9 chain1" | sha256sum
```
- the `chains.chain1` value is equal to the `provable.chains.19a8a09fc8e27789103252a15a85090f6aaccb30bb3369f30e42e726a91a3afd` value: `893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951`.

---

To retrieve the record currently refered by a chain name (i.e. the last record of the chain), you can use the following API call:

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 3,
  "status": 200,
  "data": {
    "provable": {
      "seed": "59b8340f83b9791856714baab006c2cdf1e673b80de6abe6ce1cad302f930dfa",
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "data": "b6cdad2ab703a2b537340c9872823f2a62947ed927bd7b81858aeb2afdc64100",
      "chains": {
        "19a8a09fc8e27789103252a15a85090f6aaccb30bb3369f30e42e726a91a3afd": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "aee5ef43aa31a7e4a76e3a59758c2fa2e17ee1fee433512093764c65af581cf9",
    "hash": "1bb1c73103ef6ae888ab45afa617f8ec63f21bf959a284363d7a83055ac4f87d",
    "timestamp": 1560374165362,
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    },
    "data": "dmFsdWUgOA==",
    "block": null
  }
}
```

---

You can insert a record by setting multiple `chain` and `previous` parameters.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&chain=chain1&chain=chain2&previous=893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951&previous=75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6&store=true" -d "value 9"
```

```json
{
  "took": 8,
  "status": 201,
  "data": {
    "provable": {
      "seed": "d73b036d833718e368b338dbcefb8a7f2c41cc72822e327fd23e460b4363f399",
      "id": "cbea034d571471f500be5ac0048a8c88d1157b3d210b9a54c3e2e46299b5161b",
      "data": "295e7170393e64ec9e2be0374115cff55be34d17178c59f37c2ed5b5e5ea58ed",
      "chains": {
        "281928274fc861bf59880be4888ab19fb88d7bc41f4e2f15bffaeb75ae296b9a": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "fb68662d66ac2439c5be0a6a3b2abe53d03609d2874a43df75ed153bddf70827": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "f543e10703c7331001710a5a3824dd7da545b6b0aed1a1369fadeac3defba08e",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "timestamp": 1560374257312,
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "data": "dmFsdWUgOQ=="
  }
}
```

In this case the **_precedence_** server computes at insertion time and in a atomic way the previous record(s) of this newly inserted record. It uses the chain parameters to get the list of the previous records, it merges this set to the set defined using the `previous` parameter. This atomic operation also make sure that this record is considered as the last record of the chains that have been set as parameter.

---

The previous inserted record is the last records on both `chain1` and `chain2`. Let's try to retrieve the records refered by chain `chain1` and chain `chain2` to compare the result.

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 2,
  "status": 200,
  "data": {
    "provable": {
      "seed": "d73b036d833718e368b338dbcefb8a7f2c41cc72822e327fd23e460b4363f399",
      "id": "cbea034d571471f500be5ac0048a8c88d1157b3d210b9a54c3e2e46299b5161b",
      "data": "295e7170393e64ec9e2be0374115cff55be34d17178c59f37c2ed5b5e5ea58ed",
      "chains": {
        "281928274fc861bf59880be4888ab19fb88d7bc41f4e2f15bffaeb75ae296b9a": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "fb68662d66ac2439c5be0a6a3b2abe53d03609d2874a43df75ed153bddf70827": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "f543e10703c7331001710a5a3824dd7da545b6b0aed1a1369fadeac3defba08e",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "timestamp": 1560374257312,
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "data": "dmFsdWUgOQ==",
    "block": null
  }
}
```

```bash
curl -XGET "$api/chains/chain2?pretty=true"
```

```json
{
  "took": 3,
  "status": 200,
  "data": {
    "provable": {
      "seed": "d73b036d833718e368b338dbcefb8a7f2c41cc72822e327fd23e460b4363f399",
      "id": "cbea034d571471f500be5ac0048a8c88d1157b3d210b9a54c3e2e46299b5161b",
      "data": "295e7170393e64ec9e2be0374115cff55be34d17178c59f37c2ed5b5e5ea58ed",
      "chains": {
        "281928274fc861bf59880be4888ab19fb88d7bc41f4e2f15bffaeb75ae296b9a": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "fb68662d66ac2439c5be0a6a3b2abe53d03609d2874a43df75ed153bddf70827": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "f543e10703c7331001710a5a3824dd7da545b6b0aed1a1369fadeac3defba08e",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "timestamp": 1560374257312,
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "data": "dmFsdWUgOQ==",
    "block": null
  }
}
```

We can see that both requests return the same result, both chains have the same the last record.

---

To delete an entire chain, not the blockchain itself but all records that belong to a chain, you can run the following command:

```bash
curl -XDELETE "$api/chains/chain1?pretty=true&data=true"
```

```json
{
  "took": 6,
  "status": 200,
  "data": {
    "records": 3,
    "data": {
      "records": 2,
      "bytes": 14
    }
  }
}
```

The response gives you:
- the number of records of the chain;
- the number of records whose data have been deleted;
- the total bytes released.

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 1,
  "status": 404,
  "error": 7,
  "message": "Chain \"chain1\" not found"
}
```

```bash
curl -XGET "$api/chains/chain2?pretty=true"
```

```json
{
  "took": 1,
  "status": 200,
  "data": {
    "provable": {
      "seed": "d73b036d833718e368b338dbcefb8a7f2c41cc72822e327fd23e460b4363f399",
      "id": "cbea034d571471f500be5ac0048a8c88d1157b3d210b9a54c3e2e46299b5161b",
      "data": "295e7170393e64ec9e2be0374115cff55be34d17178c59f37c2ed5b5e5ea58ed",
      "chains": {
        "281928274fc861bf59880be4888ab19fb88d7bc41f4e2f15bffaeb75ae296b9a": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "fb68662d66ac2439c5be0a6a3b2abe53d03609d2874a43df75ed153bddf70827": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "f543e10703c7331001710a5a3824dd7da545b6b0aed1a1369fadeac3defba08e",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "timestamp": 1560374257312,
    "chains": {
      "chain2": null
    },
    "block": null
  }
}
```

```bash
curl -XGET "$api/records/75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6?pretty=true"
```

```json
{
  "took": 3,
  "status": 200,
  "data": {
    "provable": {
      "seed": "16954b6dbb1f328c6377320f0c689b6c395e98e8e4d5ef0649fbd82569c4a63d",
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "data": "fcf67135dd0a94af96c05203c37e560b18c9cdfc20849b6c699690f627e470c0",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "seed": "e9708f68e3f3d50a427fc92cc82e8a4e264f6997bb8a576009193c1a6832e6ac",
    "hash": "5b193ff1cf8ac2f1aabe5fe7de85debb29e8f337bc89b135a590c1073800cf80",
    "timestamp": 1560374126359,
    "chains": {},
    "data": "dmFsdWUgNg==",
    "block": null
  }
}
```

`chain1` has been deleted as a chain label but the record that was refered to by this chain label is still available (without any data) and can be accessed using the `chain2` label. The data of record `75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6` hasn't been deleted because this record was not part of `chain1`.

### Block API calls

You can create a block by running:

```bash
curl -XPOST "$api/blocks?pretty=true&max=1"
```

```json
{
  "took": 33,
  "status": 201,
  "data": {
    "root": "b5d10b24301c0a794922d907b33d0581c637954725c34b4e458ada3dc2431676",
    "index": 1,
    "timestamp": "1560374442793",
    "count": 1,
    "previous": {
      "root": "352d90d9612d70b7fee93c12157ea67bf4f89ebac7978803c8a231fc8f92e818",
      "proof": [
        "e217a076821653ae9da66b666320fa55b5669733ee8b3b2c2d196818e0ae98792e59cd",
        "f851a0998abfb9143a9362d9bf072fbbf7a8d90b92e683a5c89bf4e0ffab8233a4780580808080a0a9afa3b4e36a95fa4d1cc48096e68f2d9dc0723d51fea5660d2774e4df152ae68080808080808080808080",
        "ea8820726576696f7573a0352d90d9612d70b7fee93c12157ea67bf4f89ebac7978803c8a231fc8f92e818"
      ]
    }
  }
}
```

The block creation API method returns the following informations:
- `took` is the number of milliseconds this request needed to be processed at server-side;
- `status` is the HTTP status code;
- `data` contains every piece of information related to the block you created;
  - `root` is the root hash of the block;
  - `index` is the block number, starting at 1;
  - `timestamp` is the record creation time (EPOCH millisecond);
  - `count` is the number of record contained in the block;
  - `previous` is `null` if `index` is `1`;
    - `root` is the root hash of the previous block
    - `proof` is the associated proof in this block (key: `previous`, value: `root` value)

To create a block without any limit on the number of record that it will contain you can run the same API call without the `max` parameter.

```bash
curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 55,
  "status": 201,
  "data": {
    "root": "8f93fec667a9bf8c772e47585697f1096f925019ee00ae05d857f7b522b96b61",
    "index": 2,
    "timestamp": "1560374472132",
    "count": 3,
    "previous": {
      "root": "b5d10b24301c0a794922d907b33d0581c637954725c34b4e458ada3dc2431676",
      "proof": [
        "f89180808080a090d8a574d55e18b0571a0c529a891eafdd332b9d6f3fa047ed07aa77da3126128080a0c646201e572a3a0ca10892e7ed838ffdbababd777d8a70d61e6dbd50a6cc8421a0a1ba5a4703c2826f86d915449c3d9d837d9d20e45b38f0a012f5312fd0dbfaa5808080a0c4d1af3588c2ab0e3279bf4ce7a9baa80f923539a806d93e552b42e992f4c34180808080",
        "ea8830726576696f7573a0b5d10b24301c0a794922d907b33d0581c637954725c34b4e458ada3dc2431676"
      ]
    }
  }
}
```

You can run the block creation again even if you do not have sent any new records.

```bash
curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 19,
  "status": 201,
  "data": {
    "root": "af6ad7694b743cec0ded2531ca7f29423d34b143eecaaa7bd5b16c7b08f153dc",
    "index": 3,
    "timestamp": "1560374485821",
    "count": 0,
    "previous": {
      "root": "8f93fec667a9bf8c772e47585697f1096f925019ee00ae05d857f7b522b96b61",
      "proof": [
        "eb892070726576696f7573a08f93fec667a9bf8c772e47585697f1096f925019ee00ae05d857f7b522b96b61"
      ]
    }
  }
}
```

A empty block is created.

If you want to avoid block creation with 0 record you can use the `no-empty` option.

```bash
curl -XPOST "$api/blocks?pretty=true&no-empty=true"
```

```json
{
  "took": 8,
  "status": 200,
  "data": null
}
```

There was no record to put in the block so the API call returned no error and did not create any new block.

---

To retrieve the pending block information you can run the following:

```bash
curl -XGET "$api/blocks?pretty=true"
```

```json
{
  "took": 1,
  "status": 200,
  "data": {
    "index": 4,
    "previous": {
      "root": "af6ad7694b743cec0ded2531ca7f29423d34b143eecaaa7bd5b16c7b08f153dc",
      "timestamp": "1560374485821"
    }
  }
}
```

You can retrieve a block by specifying its index in the path.

```bash
curl -XGET "$api/blocks/1?pretty=true"
```

```json
{
  "took": 2,
  "status": 200,
  "data": {
    "root": "b5d10b24301c0a794922d907b33d0581c637954725c34b4e458ada3dc2431676",
    "index": 1,
    "timestamp": "1560374442793",
    "count": 1,
    "previous": {
      "root": "352d90d9612d70b7fee93c12157ea67bf4f89ebac7978803c8a231fc8f92e818",
      "proof": [
        "e217a076821653ae9da66b666320fa55b5669733ee8b3b2c2d196818e0ae98792e59cd",
        "f851a0998abfb9143a9362d9bf072fbbf7a8d90b92e683a5c89bf4e0ffab8233a4780580808080a0a9afa3b4e36a95fa4d1cc48096e68f2d9dc0723d51fea5660d2774e4df152ae68080808080808080808080",
        "ea8820726576696f7573a0352d90d9612d70b7fee93c12157ea67bf4f89ebac7978803c8a231fc8f92e818"
      ]
    }
  }
}
```

You can also retrieve it using its hash.

```bash
root=$(curl -sS -XGET "$api/blocks/1?" | sed -En 's/.*"root":"([^"]*).*/\1/p')
curl -XGET "$api/blocks/$root?pretty=true"
```

```json
{
  "took": 2,
  "status": 200,
  "data": {
    "root": "352d90d9612d70b7fee93c12157ea67bf4f89ebac7978803c8a231fc8f92e818",
    "index": 0,
    "timestamp": "1560373806691",
    "count": 5,
    "previous": null
  }
}
```

## Tips

```bash
# create a block with a file
cat FILE | curl -XPOST -H "Content-Type: application/octet-stream" "$api/records" --data-binary @-

# redis interactive client
docker run --rm -it --network host redis redis-cli

# redis client command
docker run --rm -i --network host redis redis-cli info
docker run --rm -i --network host redis redis-cli eval "return #redis.call('keys', 'precedence.chain.*')" 0
```

## Ongoing developments

- ECMAScript 6 or Typescript with unit/integration tests, code coverage, code documentation, loggers with log level
- split modules into dedicated projects?
- NPM publication
- Redis auto-reconnection (bad gateway error)

# Change Data Capture

**precedence** can be easily plugged to an open source project that provides a low latency data streaming platform for change data capture (CDC) named [Debezium](https://github.com/debezium/debezium). We implemented a connector compliant with both Debezium and **precedence** and we have released it in the GitHub project [inblocks/precedence-debezium](https://github.com/inblocks/precedence-debezium). You should refer to this other project documentation to know more about the way **precedence** and Debezium can be plugged to each other.

If you want to run a demo by yourself you can check [this page](https://github.com/inblocks/precedence-debezium/tree/poc-1/demo).
