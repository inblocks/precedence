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
- "fingerprint" means "hexadecimal string format for the hash computed with SHA-256 algorithm";
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

- If you don't use [Docker](https://docs.docker.com): [Node.js](https://nodejs.org) version 10.18.1+ and [npm](https://www.npmjs.com) version 6.13.4+.

## Run the REST API

- From npm (coming soon)

- From [Docker](https://hub.docker.com/r/inblocks/precedence)
  ```bash
  # usage
  docker run --rm inblocks/precedence --help
  # run
  docker run --rm --name precedence \
      --link redis -p 9000:9000 \
      -e PRECEDENCE_PRIVATE_KEY=5962a8486b88c88d14e16a18fd1bbc0207603d84f9cd6434b477baa88da40200 \
      inblocks/precedence --redis redis:6379
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
  export PRECEDENCE_PRIVATE_KEY=5962a8486b88c88d14e16a18fd1bbc0207603d84f9cd6434b477baa88da40200
  precedence-api
  ```

# First commands

Make sure the `api` environment variable is the API endpoint you want to use.

```bash
api="http://localhost:9000"
```

## Record API calls

To create a first record you can use the following command. By default the original data is not stored in **_precedence_**, the only data-related information stored is its fingerprint.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true" -d "value 1"
```

You will find below a response example.

```json
{
  "took": 30,
  "status": 201,
  "data": {
    "provable": {
      "id": "515c2d912558536fab4bae49d62300756eb7dd0440fd5556209cacfd0bdffb46",
      "seed": "db9e743b56f80def2491a3034352b2b9e4fc85833d3c58149e025bbd3731edc2",
      "hash": "1db29d81fead3f9da6e7a7d87a9707a97daf72264ebcb90a6e2da6ff7421ffc8",
      "address": "ad4030de8b458226ca93f89539bfb4a872c13ec761c722f989b630cb7e22fd6a",
      "signature": "b42ef5517018990440f275a499f03e5e08f8fc69e45aece7d5406f5a66ffd966",
      "chains": {},
      "previous": []
    },
    "timestamp": 1582033013290,
    "seed": "856191948bfbf7feeefaa3b5851ba620d9de87a31d774d6889728a4ee9cffdbb",
    "hash": "65da867639080176b5998c77219e2745474aa518a04268522467322f06fbd9d9",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xcc8bfb566fe89bdc2b6bfce1e35886cda7cf790492b117f12696eeb8ce5bcd3278c7c43cdfcda56e82c70064d7fd02ecbdc3c73caad0a7371136b491c8b44a201b",
    "chains": {}
  }
}
```

For sure you need some explanation about the returned JSON response:
- `took` is the number of millisecond this request needed to be processed at server-side;
- `status` is the HTTP status code;
- `data` contains every piece of information related to the original data you provided;
  - `provable` contains the information that you will be able to prove using **_precedence_**;
    - `id` is the record identifier;
    - `seed` is the obfuscated fingerprint of the root `seed`;
    - `hash` is the obfuscated fingerprint of the root `hash`;
    - `address` is the obfuscated fingerprint of root `address`;
    - `signature` is the obfuscated fingerprint of root `signature`;
    - `chains` is the root `chains` but where keys and values are the obfuscated fingerprint of their original value;
    - `previous` is the list of the record identifiers that are directly linked to this record;
  - `timestamp` is the record creation time (EPOCH millisecond);
  - `seed` is the random data used for obfuscation;
  - `hash` is the fingerprint of the original data;
  - `address` is used for proof-of-ownership, corresponding to the public key of ECDSA key pair used to sign the root `hash`;
  - `signature` is the Ethereum signature of the root `hash`;
  - `chains` is the map of relation between a chain and its last record identifier;

We can check that:
- the fingerprint of `seed` value is equal to `provable.seed` value:
```bash
echo -n '856191948bfbf7feeefaa3b5851ba620d9de87a31d774d6889728a4ee9cffdbb 856191948bfbf7feeefaa3b5851ba620d9de87a31d774d6889728a4ee9cffdbb' | sha256sum
```
- the obfuscated fingerprint of the hash is equal to `provable.hash` value:
```bash
echo -n "856191948bfbf7feeefaa3b5851ba620d9de87a31d774d6889728a4ee9cffdbb $(echo -n 'value 1' | sha256sum | cut -d' ' -f1)" | sha256sum
```
- the signature is valid with [https://etherscan.io/verifySig](https://etherscan.io/verifySig):
  - [Step 1] Address: `0x4592350babefcc849943db091b6c49f8b86f8aaa`;
  - [Step 2] Message Signature Hash: `0xcc8bfb566fe89bdc2b6bfce1e35886cda7cf790492b117f12696eeb8ce5bcd3278c7c43cdfcda56e82c70064d7fd02ecbdc3c73caad0a7371136b491c8b44a201b`;
  - [Step 3] Enter the original message that was signed: `65da867639080176b5998c77219e2745474aa518a04268522467322f06fbd9d9`;
  - Verify: `Message Signature Verified`.
---

Let's create another record with the `store=true` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```

```json
{
  "took": 21,
  "status": 201,
  "data": {
    "provable": {
      "id": "afcdd9254db4b52474e53f68733d4f7259ed5863e950fdd0f03f0ae5b832332a",
      "seed": "32cde58ade38cf07a507543f3d5b3e6b601b60705272b3539f49a658997b7b2d",
      "hash": "b67b9ecf2edebbd7dd0c30dea2e24471595c445bbdd25307a58e698cb2990cc8",
      "address": "9d4bf1b206fdee4165ce70dbaccde2351a3f3d877d48415ddb42889df3b78267",
      "signature": "fad57d978dde0da989ca2529361902690a7f51184260ab95da41da5e80523739",
      "chains": {},
      "previous": []
    },
    "timestamp": 1582033013428,
    "seed": "a27989519a383167bc53f7b9dfc575d71c66bcfdb8bcf270aab04188f51ec41d",
    "hash": "e0a44d3c544c8895dacc7c32952766ee4db44122af955826e45c9486639ef5e4",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xbcb94922257b69fb5bf7bee76be9110100b569290e234b580f6ca8a96af477c37708eaf951ad2032bd3f9c453dc4d74e0db03cd554356ef95baccf4ea0ea0d801b",
    "chains": {},
    "data": {
      "bytes": 7
    }
  }
}
```

You can see that you have persisted 7 bytes in **_precedence_** (`data.bytes` field).

To retrieve the original data you can run: 

```bash
curl -XGET "$api/records/afcdd9254db4b52474e53f68733d4f7259ed5863e950fdd0f03f0ae5b832332a?data=true"
```

---

Let's create the same original data again.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```
```json
{
  "took": 19,
  "status": 201,
  "data": {
    "provable": {
      "id": "d12e03f214657a86b07deedb1da1154478386bb5e20a26d51f2669d86db15337",
      "seed": "e8f5dbcf2c776425196f78115682abc6b87bc65c0bba0cc7d10317711dd96c76",
      "hash": "193552f4e7fb203403ac46aee50b5a082f3b01a08c233b09134630755882376e",
      "address": "4ca2664131c964cd8e1f2cdf102a5eec675d24975b0bf70266bf454c1619a679",
      "signature": "bdf31e6093da1eb34f576f57ee5a41c98675a86d671577c643a8d4c0e446e40b",
      "chains": {},
      "previous": []
    },
    "timestamp": 1582033013544,
    "seed": "730ace00775e23ad93d619215e108774753c606a9ac941f26e2ad27e974b619b",
    "hash": "e0a44d3c544c8895dacc7c32952766ee4db44122af955826e45c9486639ef5e4",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xbcb94922257b69fb5bf7bee76be9110100b569290e234b580f6ca8a96af477c37708eaf951ad2032bd3f9c453dc4d74e0db03cd554356ef95baccf4ea0ea0d801b",
    "chains": {},
    "data": {
      "bytes": 7
    }
  }
}
```

All the values of the `provable` object are different from the previous one, even with the same original data. This is made possible by using the `seed` in the hashing process. This way the `provable` fields are 100% obfuscated and can not lead to data leaking.

---

It is also possible to provide the fingerprint of the original data with the `hash` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&hash=085a57ddb929d1a2853aad31940d6e718918762b8db43f299e86fe732d13d6b9" -d "value 4"
```

```json
{
  "took": 22,
  "status": 201,
  "data": {
    "provable": {
      "id": "f39a0663403de342caa00e803a7fc87bb3eeb2f4ea004499f7071b441a374777",
      "seed": "f22b40056d4546973a9ee9fd5d5a0cebf41a5da096ff91b4ad98c549d66aaac3",
      "hash": "82ef3a11069b506660bb1dc0a85a11dda9f673f08228b1825d39e20915d45980",
      "address": "71d615b672a3410c5ac36ccbe2c3dea54e9b0cbd65d1f5336fa43952bdd2e79e",
      "signature": "d24b762e519e3719772cd4b40de19fb943facd69a4b268852499e4b4f264716d",
      "chains": {},
      "previous": []
    },
    "timestamp": 1582033013580,
    "seed": "7b7eb31795ac262e454d7030b4a3c157a3ba7875c93e1bce072c19e2db9c67da",
    "hash": "085a57ddb929d1a2853aad31940d6e718918762b8db43f299e86fe732d13d6b9",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x0335865798e357d8dbe4a851f387e2f091be6eca16d3909711a0450eb030323a12cf602f31b1635add36f2bd67a4bd5a49e175ac86c828b811a06c30c49b3fc21c",
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
  "took": 18,
  "status": 201,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "27dd3a0fc1534eaa65ddc8761e8e973788a2cc9534ed01e40c70f096e69d7f7a",
      "hash": "b78bc21a649b43d2671fc72f1fe337568770772e99b1d68e4732ebf4c00b42ec",
      "address": "138042ece646fbbf3ad7c0184bd965a0d225ca2e8d3ae31944e9b0d0515078c1",
      "signature": "d4e27248609d9bfa86fa5cbdc607cec7620019060864af2ba4a83300e22462ca",
      "chains": {},
      "previous": []
    },
    "timestamp": 1582033013619,
    "seed": "8cdbe68c9527b75cc03636ca38e81b630a5e4a424240d0249858bf92fe02cda3",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "chains": {},
    "data": {
      "bytes": 7
    }
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
  "took": 12,
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
  "took": 6,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "27dd3a0fc1534eaa65ddc8761e8e973788a2cc9534ed01e40c70f096e69d7f7a",
      "hash": "b78bc21a649b43d2671fc72f1fe337568770772e99b1d68e4732ebf4c00b42ec",
      "address": "138042ece646fbbf3ad7c0184bd965a0d225ca2e8d3ae31944e9b0d0515078c1",
      "signature": "d4e27248609d9bfa86fa5cbdc607cec7620019060864af2ba4a83300e22462ca",
      "chains": {},
      "previous": []
    },
    "timestamp": 1582033013619,
    "seed": "8cdbe68c9527b75cc03636ca38e81b630a5e4a424240d0249858bf92fe02cda3",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "chains": {},
    "data": {
      "bytes": 7
    }
  }
}
```

To create a new block you can run the following command. To know more about block management check the dedicated `block` documentation section below.

```bash
curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 121,
  "status": 201,
  "data": {
    "root": "4a156ee21d2a536f81e0f4bb0ce91eef7540d49d0d32300211517a3c388a8800",
    "index": 0,
    "timestamp": 1582033013802,
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
  "took": 16,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "27dd3a0fc1534eaa65ddc8761e8e973788a2cc9534ed01e40c70f096e69d7f7a",
      "hash": "b78bc21a649b43d2671fc72f1fe337568770772e99b1d68e4732ebf4c00b42ec",
      "address": "138042ece646fbbf3ad7c0184bd965a0d225ca2e8d3ae31944e9b0d0515078c1",
      "signature": "d4e27248609d9bfa86fa5cbdc607cec7620019060864af2ba4a83300e22462ca",
      "chains": {},
      "previous": []
    },
    "timestamp": 1582033013619,
    "seed": "8cdbe68c9527b75cc03636ca38e81b630a5e4a424240d0249858bf92fe02cda3",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "chains": {},
    "data": {
      "bytes": 7
    },
    "block": {
      "root": "4a156ee21d2a536f81e0f4bb0ce91eef7540d49d0d32300211517a3c388a8800",
      "proof": [
        "f8d1808080a07284bc653d4d1d20062dfc5a429c15f9e2e539a77ecf528f907387530f1e8a6980a0d8077c0a45b0511487db8e51a0ac8da8cd9c110b1cb57b018021008e2e6ace3780a04e2f9daa89c599f90efe567a05337fa1f8d99de7e634eff5c0e71bc37bf2d7ec8080a029d10693dea88e6f8ae7b71c13a73a7bd9c031c030c90c2b999629921b4cab2f8080a0829748456c657f0c2ff9f728fa5ceac335add700976ee42de80ce378b92986f180a0ef9b291f308f7529175dc468d2ad728a2d6f7931fa2547a014de609732975c3980",
        "f842a03a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a0bff4099e7a3d646c2e2bae1c8b742e9cc1017703b6bcfcbb4ca63fc6630e1756"
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
  "took": 7,
  "status": 200,
  "data": {
    "bytes": 7
  }
}
```

The record data has been deleted releasing `7` bytes, let's retrieve this record again.

```bash
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 11,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "27dd3a0fc1534eaa65ddc8761e8e973788a2cc9534ed01e40c70f096e69d7f7a",
      "hash": "b78bc21a649b43d2671fc72f1fe337568770772e99b1d68e4732ebf4c00b42ec",
      "address": "138042ece646fbbf3ad7c0184bd965a0d225ca2e8d3ae31944e9b0d0515078c1",
      "signature": "d4e27248609d9bfa86fa5cbdc607cec7620019060864af2ba4a83300e22462ca",
      "chains": {},
      "previous": []
    },
    "timestamp": 1582033013619,
    "seed": "8cdbe68c9527b75cc03636ca38e81b630a5e4a424240d0249858bf92fe02cda3",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "chains": {},
    "block": {
      "root": "4a156ee21d2a536f81e0f4bb0ce91eef7540d49d0d32300211517a3c388a8800",
      "proof": [
        "f8d1808080a07284bc653d4d1d20062dfc5a429c15f9e2e539a77ecf528f907387530f1e8a6980a0d8077c0a45b0511487db8e51a0ac8da8cd9c110b1cb57b018021008e2e6ace3780a04e2f9daa89c599f90efe567a05337fa1f8d99de7e634eff5c0e71bc37bf2d7ec8080a029d10693dea88e6f8ae7b71c13a73a7bd9c031c030c90c2b999629921b4cab2f8080a0829748456c657f0c2ff9f728fa5ceac335add700976ee42de80ce378b92986f180a0ef9b291f308f7529175dc468d2ad728a2d6f7931fa2547a014de609732975c3980",
        "f842a03a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a0bff4099e7a3d646c2e2bae1c8b742e9cc1017703b6bcfcbb4ca63fc6630e1756"
      ]
    }
  }
}
```

The `data` field has been removed from the response and if you try to get the original data, you'll get an error.

```bash
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true&data=true"
```

```json
{
  "took": 3,
  "status": 404,
  "error": 5,
  "message": "Record \"3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4\" data not found"
}
```

---

To create a record as a new state of an existing record you should use the `previous` parameter. It allows you to link you records with each other.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=61E51581-7763-4486-BF04-35045DC7A0D3&store=true&previous=3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4" -d "value 6"
```

```json
{
  "took": 20,
  "status": 201,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "cd81e327f689dc75c22e15c9a955b3668e31831d383ebfa4dfae7ef8e071e9c6",
      "hash": "169278b6c2f9dd5b36dd6ef4219de620576f0078fb8efdb0014d2ef7b8f6f88e",
      "address": "d61f7f2aade6b1e6d6ac91bdd074ad5e2a301d55f76fd6799dca9ee1464ffa29",
      "signature": "2525d0199bb251498a4db125ee0cfda999890506a2056e5f8acb1080c7042880",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "timestamp": 1582033013932,
    "seed": "31e3831a4ab13c3d7b79641022a11332fe55c15f096d67c0c90ef3a788b051c7",
    "hash": "5b193ff1cf8ac2f1aabe5fe7de85debb29e8f337bc89b135a590c1073800cf80",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xa6bbc4cc1e50088492dc482801c4d4695d14f367b3b10e34f93a962e1a8213b634b7bfa6a95edc6bbc25a359cf9a4554d6dee72078a671f401b6aa667dcb1ab31c",
    "chains": {},
    "data": {
      "bytes": 7
    }
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
  "took": 17,
  "status": 201,
  "data": {
    "provable": {
      "id": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951",
      "seed": "079d0bb74ab00ff9ba28dfee118caecc2c5dc51a96413fb98e34fe23cfdb8f42",
      "hash": "8827f0e7d56721dc11982fc5db01254f6262cb7938578f390963e02f4313f128",
      "address": "4e45b5d474b1d5a6958761c616b2e94039d54b6a9340e3499fc9486163501ba4",
      "signature": "b35de504f750c6fc4265ab2b793a2ac108c908936e3142440ab086f724982b95",
      "chains": {
        "73f317d288998361213a8b7ffcfe858b28d49cd727d158b2628f5baade96612b": null
      },
      "previous": []
    },
    "timestamp": 1582033013967,
    "seed": "a3fd375c81de861002bd3332acd2eef65fa954a065afb18d0719d30d73c0c13b",
    "hash": "ed914881e913845413125b682876d976b9eab7335980726ddc59f785beb4d5ad",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xa1d9b27cb9cbcdda4172a373ef4e82f13f193d837e2e21b760685d099354ef7a7e3250470af7e33ffe6b77aa27b0d509b00e311917249a022abf4cc8469506751b",
    "chains": {
      "chain1": null
    }
  }
}
```

The field `chains` contains information about the chain state at insertion time. In this scenario the chain `chain1` was never used before so this newly created record is the first and the last record of this chain. Because there was no record in this chain the value set in `chain.chain1` is `null`. When the chain exists, the inserted record is appended behind the last record of the chain specified in the parameter `chain`. In the same time, and in a atomic way, the newly inserted record become the last record of the chain and can be refered to using the `chain1` label.

Let's insert a second record using this `chain1` label.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&chain=chain1&store=true" -d "value 8"
```

```json
{
  "took": 19,
  "status": 201,
  "data": {
    "provable": {
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "seed": "1f3592672cda2cc7b783df25f76b1c9a83ce3c3a870ada706959242a60f2ded5",
      "hash": "4d82481e10f040d61532e9c9b102b517b38fdbd0484d5902fd611557bc28a629",
      "address": "17cae495a9694303ce4dc38123f815a487140344ae456708cc84ec082d406245",
      "signature": "4e805b815ecf33bbd4c66a25fdddf3d6a1e01c0641d5aa15a2f61bb5eb7e14b9",
      "chains": {
        "970bb3b01e9aa43ac74de8267a19422a716f01ff57113bf4e47482c2bbbab1ed": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1582033014001,
    "seed": "58a6e9bd2165853d8e16dd9ab0ef1af19d7605bb0363e5e6cadbba640ab06dd6",
    "hash": "1bb1c73103ef6ae888ab45afa617f8ec63f21bf959a284363d7a83055ac4f87d",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x13f6c3fbc6513cd9dbeca59878613ea10f2356bf5fcc75d15b8993ceb5cb56156b11668c316505ba817f8ab2a0edb24b555de3442865ee336f0b9f3cad8634ae1b",
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    },
    "data": {
      "bytes": 7
    }
  }
}
```

The field `chains` contains the key `chain1` whose value is the record identifier of the previously inserted record. The record has been appended at the end of the chain and the label `chain1` now refers to the newly inserted record. This information is provable because it is part of the record definition. The key stored in `provable.chains` has been obfuscated to avoid any data leak. `chains.chain1` can be removed by deleting the entire chain.

We can check that:
- the obfuscated fingerprint of `chain1` is equal to `970bb3b01e9aa43ac74de8267a19422a716f01ff57113bf4e47482c2bbbab1ed`:
```bash
echo -n "58a6e9bd2165853d8e16dd9ab0ef1af19d7605bb0363e5e6cadbba640ab06dd6 chain1" | sha256sum
```
- the `chains.chain1` value is equal to the `provable.chains.970bb3b01e9aa43ac74de8267a19422a716f01ff57113bf4e47482c2bbbab1ed` value: `893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951`.

---

To retrieve the record currently refered by a chain name (i.e. the last record of the chain), you can use the following API call:

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 7,
  "status": 200,
  "data": {
    "provable": {
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "seed": "1f3592672cda2cc7b783df25f76b1c9a83ce3c3a870ada706959242a60f2ded5",
      "hash": "4d82481e10f040d61532e9c9b102b517b38fdbd0484d5902fd611557bc28a629",
      "address": "17cae495a9694303ce4dc38123f815a487140344ae456708cc84ec082d406245",
      "signature": "4e805b815ecf33bbd4c66a25fdddf3d6a1e01c0641d5aa15a2f61bb5eb7e14b9",
      "chains": {
        "970bb3b01e9aa43ac74de8267a19422a716f01ff57113bf4e47482c2bbbab1ed": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1582033014001,
    "seed": "58a6e9bd2165853d8e16dd9ab0ef1af19d7605bb0363e5e6cadbba640ab06dd6",
    "hash": "1bb1c73103ef6ae888ab45afa617f8ec63f21bf959a284363d7a83055ac4f87d",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x13f6c3fbc6513cd9dbeca59878613ea10f2356bf5fcc75d15b8993ceb5cb56156b11668c316505ba817f8ab2a0edb24b555de3442865ee336f0b9f3cad8634ae1b",
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    },
    "data": {
      "bytes": 7
    }
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
  "took": 19,
  "status": 201,
  "data": {
    "provable": {
      "id": "4b81481b421ffa7af2341e53353764204a1e968ca731a95030723279f7918eee",
      "seed": "e0a18a5ebcbe76b099a62adf9079b3b7b067b0a00399fe08290e8badb187e53c",
      "hash": "699bf43045cf7cfefc071345ac0e0840abe2d279e1b1ca78301739a671ab5803",
      "address": "2f5ae874cec08e7661038e5450d92b76ec7c1505cb4bb5b4bf7c2848143bd623",
      "signature": "2fad950b78428d54835a188e3d136b93494ee37ba48ebcbd5177420e8b0c0a1f",
      "chains": {
        "ee8f06a2d53e7bf8ca03b0d086aca54db5dcc8ac0801447d26def03e947fb04f": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "8439f47ef4b10c5090dc38b47d95c711f9339f7d10c9edb2c10d4b101f533ecf": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1582033014166,
    "seed": "ed9dffca426db4b98aae6c9fc2caa5fc780ccc7759dd0b33a72db22651d16907",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "data": {
      "bytes": 7
    }
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
  "took": 8,
  "status": 200,
  "data": {
    "provable": {
      "id": "4b81481b421ffa7af2341e53353764204a1e968ca731a95030723279f7918eee",
      "seed": "e0a18a5ebcbe76b099a62adf9079b3b7b067b0a00399fe08290e8badb187e53c",
      "hash": "699bf43045cf7cfefc071345ac0e0840abe2d279e1b1ca78301739a671ab5803",
      "address": "2f5ae874cec08e7661038e5450d92b76ec7c1505cb4bb5b4bf7c2848143bd623",
      "signature": "2fad950b78428d54835a188e3d136b93494ee37ba48ebcbd5177420e8b0c0a1f",
      "chains": {
        "ee8f06a2d53e7bf8ca03b0d086aca54db5dcc8ac0801447d26def03e947fb04f": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "8439f47ef4b10c5090dc38b47d95c711f9339f7d10c9edb2c10d4b101f533ecf": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1582033014166,
    "seed": "ed9dffca426db4b98aae6c9fc2caa5fc780ccc7759dd0b33a72db22651d16907",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "data": {
      "bytes": 7
    }
  }
}
```

```bash
curl -XGET "$api/chains/chain2?pretty=true"
```

```json
{
  "took": 7,
  "status": 200,
  "data": {
    "provable": {
      "id": "4b81481b421ffa7af2341e53353764204a1e968ca731a95030723279f7918eee",
      "seed": "e0a18a5ebcbe76b099a62adf9079b3b7b067b0a00399fe08290e8badb187e53c",
      "hash": "699bf43045cf7cfefc071345ac0e0840abe2d279e1b1ca78301739a671ab5803",
      "address": "2f5ae874cec08e7661038e5450d92b76ec7c1505cb4bb5b4bf7c2848143bd623",
      "signature": "2fad950b78428d54835a188e3d136b93494ee37ba48ebcbd5177420e8b0c0a1f",
      "chains": {
        "ee8f06a2d53e7bf8ca03b0d086aca54db5dcc8ac0801447d26def03e947fb04f": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "8439f47ef4b10c5090dc38b47d95c711f9339f7d10c9edb2c10d4b101f533ecf": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1582033014166,
    "seed": "ed9dffca426db4b98aae6c9fc2caa5fc780ccc7759dd0b33a72db22651d16907",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "data": {
      "bytes": 7
    }
  }
}
```

We can see that both requests return the same result, both chains have the same the last record.

---

To delete a chain, the label not the blockchain itself, you can run the following command:

```bash
curl -XDELETE "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 8,
  "status": 200,
  "data": {
    "id": "4b81481b421ffa7af2341e53353764204a1e968ca731a95030723279f7918eee"
  }
}
```

The response gives you the last record id.

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 3,
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
  "took": 8,
  "status": 200,
  "data": {
    "provable": {
      "id": "4b81481b421ffa7af2341e53353764204a1e968ca731a95030723279f7918eee",
      "seed": "e0a18a5ebcbe76b099a62adf9079b3b7b067b0a00399fe08290e8badb187e53c",
      "hash": "699bf43045cf7cfefc071345ac0e0840abe2d279e1b1ca78301739a671ab5803",
      "address": "2f5ae874cec08e7661038e5450d92b76ec7c1505cb4bb5b4bf7c2848143bd623",
      "signature": "2fad950b78428d54835a188e3d136b93494ee37ba48ebcbd5177420e8b0c0a1f",
      "chains": {
        "ee8f06a2d53e7bf8ca03b0d086aca54db5dcc8ac0801447d26def03e947fb04f": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "8439f47ef4b10c5090dc38b47d95c711f9339f7d10c9edb2c10d4b101f533ecf": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1582033014166,
    "seed": "ed9dffca426db4b98aae6c9fc2caa5fc780ccc7759dd0b33a72db22651d16907",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "data": {
      "bytes": 7
    }
  }
}
```

```bash
curl -XGET "$api/records/75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6?pretty=true"
```

```json
{
  "took": 5,
  "status": 200,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "cd81e327f689dc75c22e15c9a955b3668e31831d383ebfa4dfae7ef8e071e9c6",
      "hash": "169278b6c2f9dd5b36dd6ef4219de620576f0078fb8efdb0014d2ef7b8f6f88e",
      "address": "d61f7f2aade6b1e6d6ac91bdd074ad5e2a301d55f76fd6799dca9ee1464ffa29",
      "signature": "2525d0199bb251498a4db125ee0cfda999890506a2056e5f8acb1080c7042880",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "timestamp": 1582033013932,
    "seed": "31e3831a4ab13c3d7b79641022a11332fe55c15f096d67c0c90ef3a788b051c7",
    "hash": "5b193ff1cf8ac2f1aabe5fe7de85debb29e8f337bc89b135a590c1073800cf80",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xa6bbc4cc1e50088492dc482801c4d4695d14f367b3b10e34f93a962e1a8213b634b7bfa6a95edc6bbc25a359cf9a4554d6dee72078a671f401b6aa667dcb1ab31c",
    "chains": {},
    "data": {
      "bytes": 7
    }
  }
}
```

`chain1` has been deleted as a chain label but the record that was referred to by this chain label is still available and can be accessed using the `chain2` label.

### Block API calls

You can create a block by running:

```bash
curl -XPOST "$api/blocks?pretty=true&max=1"
```

```json
{
  "took": 111,
  "status": 201,
  "data": {
    "root": "731a917adb69daf1f0adcd4cce89baec2132b0362011c058d0115ac93b8e607f",
    "index": 1,
    "timestamp": 1582033014395,
    "count": 1,
    "previous": {
      "root": "4a156ee21d2a536f81e0f4bb0ce91eef7540d49d0d32300211517a3c388a8800",
      "proof": [
        "e217a005f765197528e8f7d5430d2aa1614eb696b16849b8b31d60393b138e97465e99",
        "f871a06840c8a74dc18f8221ed86ac4830ce05baccd35b83ab25e320f780be00c21e038080a040dc53b05b7117e04a4dc5c468f793463418132841100386911eeb3d3c44e06e80a08394dc753df0b2a14499126b3f024a36995b95a2c16de29c1edadf4ff990a5b58080808080808080808080",
        "ea8820726576696f7573a04a156ee21d2a536f81e0f4bb0ce91eef7540d49d0d32300211517a3c388a8800"
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
  - `index` is the block number, starting at 0;
  - `timestamp` is the record creation time (EPOCH millisecond);
  - `count` is the number of record contained in the block;
  - `previous` is `null` if `index` is `0`;
    - `root` is the root hash of the previous block;
    - `proof` is the associated proof in this block.

To create a block without any limit on the number of record that it will contain you can run the same API call without the `max` parameter.

```bash
curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 103,
  "status": 201,
  "data": {
    "root": "e30ad9ad868436b0037ebb94948b9a4768582b1412f3c2473d1fc1630fc22fa7",
    "index": 2,
    "timestamp": 1582033014542,
    "count": 3,
    "previous": {
      "root": "731a917adb69daf1f0adcd4cce89baec2132b0362011c058d0115ac93b8e607f",
      "proof": [
        "f87180808080a0939657bc5830f8053a4d2c000017c46a111d2622b559f52d1c71ea3f44edfbd48080a0035112c1a1b8d42c93bee2d43360edcf315a605d490d65fc69ecbd982a336864a043e41394f957bb3b13f6794518700cba9c3f2becaaf6cb399e5350b61b7fe7cf8080808080808080",
        "f851a0a1d7d494d7426a42b90ec426249b1667437e232049b0651b3ae3855586d9e1de8080a02809d70a63e2110b247a58feedd37d9f12f1586dc184a0f8e44b2ca4eef6f52580808080808080808080808080",
        "ea8820726576696f7573a0731a917adb69daf1f0adcd4cce89baec2132b0362011c058d0115ac93b8e607f"
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
  "took": 52,
  "status": 201,
  "data": {
    "root": "935d66a7f49656db2e20c266829901c5f5db720a9e9a0ec284674346a358b254",
    "index": 3,
    "timestamp": 1582033014614,
    "count": 0,
    "previous": {
      "root": "e30ad9ad868436b0037ebb94948b9a4768582b1412f3c2473d1fc1630fc22fa7",
      "proof": [
        "e217a012c74fa11aa65a4e717065a21ff92bcdccdfc01cccdbf2f3c4ab97ffce9c113c",
        "f851a091ed0b4e7bbc2a0aaa8764213d86ab0a45c8865634255bfe4adb9cb275d7af098080a064b8feaa303bd1f0c61b66ed62759d5adc919ea6b4076126d96db589954c700f80808080808080808080808080",
        "ea8820726576696f7573a0e30ad9ad868436b0037ebb94948b9a4768582b1412f3c2473d1fc1630fc22fa7"
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
  "took": 19,
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
  "took": 6,
  "status": 200,
  "data": {
    "count": 0,
    "previous": {
      "root": "935d66a7f49656db2e20c266829901c5f5db720a9e9a0ec284674346a358b254",
      "index": 3,
      "timestamp": 1582033014614,
      "count": 0,
      "previous": {
        "root": "e30ad9ad868436b0037ebb94948b9a4768582b1412f3c2473d1fc1630fc22fa7",
        "proof": [
          "e217a012c74fa11aa65a4e717065a21ff92bcdccdfc01cccdbf2f3c4ab97ffce9c113c",
          "f851a091ed0b4e7bbc2a0aaa8764213d86ab0a45c8865634255bfe4adb9cb275d7af098080a064b8feaa303bd1f0c61b66ed62759d5adc919ea6b4076126d96db589954c700f80808080808080808080808080",
          "ea8820726576696f7573a0e30ad9ad868436b0037ebb94948b9a4768582b1412f3c2473d1fc1630fc22fa7"
        ]
      }
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
  "took": 7,
  "status": 200,
  "data": {
    "root": "731a917adb69daf1f0adcd4cce89baec2132b0362011c058d0115ac93b8e607f",
    "index": 1,
    "timestamp": 1582033014395,
    "count": 1,
    "previous": {
      "root": "4a156ee21d2a536f81e0f4bb0ce91eef7540d49d0d32300211517a3c388a8800",
      "proof": [
        "e217a005f765197528e8f7d5430d2aa1614eb696b16849b8b31d60393b138e97465e99",
        "f871a06840c8a74dc18f8221ed86ac4830ce05baccd35b83ab25e320f780be00c21e038080a040dc53b05b7117e04a4dc5c468f793463418132841100386911eeb3d3c44e06e80a08394dc753df0b2a14499126b3f024a36995b95a2c16de29c1edadf4ff990a5b58080808080808080808080",
        "ea8820726576696f7573a04a156ee21d2a536f81e0f4bb0ce91eef7540d49d0d32300211517a3c388a8800"
      ]
    }
  }
}
```

You can also retrieve it using its hash.

```bash
curl -XGET "$api/blocks/731a917adb69daf1f0adcd4cce89baec2132b0362011c058d0115ac93b8e607f?pretty=true"
```

```json
{
  "took": 6,
  "status": 200,
  "data": {
    "root": "731a917adb69daf1f0adcd4cce89baec2132b0362011c058d0115ac93b8e607f",
    "index": 1,
    "timestamp": 1582033014395,
    "count": 1,
    "previous": {
      "root": "4a156ee21d2a536f81e0f4bb0ce91eef7540d49d0d32300211517a3c388a8800",
      "proof": [
        "e217a005f765197528e8f7d5430d2aa1614eb696b16849b8b31d60393b138e97465e99",
        "f871a06840c8a74dc18f8221ed86ac4830ce05baccd35b83ab25e320f780be00c21e038080a040dc53b05b7117e04a4dc5c468f793463418132841100386911eeb3d3c44e06e80a08394dc753df0b2a14499126b3f024a36995b95a2c16de29c1edadf4ff990a5b58080808080808080808080",
        "ea8820726576696f7573a04a156ee21d2a536f81e0f4bb0ce91eef7540d49d0d32300211517a3c388a8800"
      ]
    }
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
docker run --rm -i --network host redis redis-cli eval "return #redis.call('keys', 'precedence.*')" 0
```

## Ongoing developments

- ECMAScript 6 or Typescript with unit/integration tests, code coverage, code documentation, loggers with log level
- split modules into dedicated projects?
- NPM publication
- Redis auto-reconnection (bad gateway error)

# Change Data Capture

**precedence** can be easily plugged to an open source project that provides a low latency data streaming platform for change data capture (CDC) named [Debezium](https://github.com/debezium/debezium). We implemented a connector compliant with both Debezium and **precedence** and we have released it in the GitHub project [inblocks/precedence-debezium](https://github.com/inblocks/precedence-debezium). You should refer to this other project documentation to know more about the way **precedence** and Debezium can be plugged to each other.

If you want to run a demo by yourself you can check [this page](https://github.com/inblocks/precedence-debezium/tree/poc-1/demo).
