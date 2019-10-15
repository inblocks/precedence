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

To create a first record you can use the following command. By default the data is not stored in **_precedence_**, the only data-related information stored is its fingerprint.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true" -d "value 1"
```

You will find below a response example.

```json
{
  "took": 25,
  "status": 201,
  "data": {
    "provable": {
      "id": "3e21d1415baf38ec0fd2fb0f7f7482859f1c414ba68d01e9e2334f42668fa799",
      "seed": "6ba647fb1d867b54e410e88ec0111cdf33cb10e810d46617f1516a4b08f64855",
      "hash": "0ef74638d6769055624139b2e746040b92ed9ea9275ac97ced9ac45f47091129",
      "address": "f82c829a339798f8e2f1b4d7b46006c7dd81e6a5f395edbe420f98e7dab67bcd",
      "signature": "052b9578e48f8eca03b5f0cbeaa82c14aeadf6412588c24f79751b2ce290efa3",
      "chains": {},
      "previous": []
    },
    "timestamp": 1571151275642,
    "seed": "0c7b6f5b79d1e2a7b8eee20e6e653226b3a946b7da58ee1a8b148b45cb528c04",
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
- `data` contains every piece of information related to the data you provided;
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
  - `chains` is the map of relation between a chain and its last record identifier.

We can check that:
- the fingerprint of `seed` value is equal to `provable.seed` value:
```bash
echo -n '0c7b6f5b79d1e2a7b8eee20e6e653226b3a946b7da58ee1a8b148b45cb528c04 0c7b6f5b79d1e2a7b8eee20e6e653226b3a946b7da58ee1a8b148b45cb528c04' | sha256sum
# -> 6ba647fb1d867b54e410e88ec0111cdf33cb10e810d46617f1516a4b08f64855
```
- the obfuscated fingerprint of the hash is equal to `provable.hash` value:
```bash
echo -n "0c7b6f5b79d1e2a7b8eee20e6e653226b3a946b7da58ee1a8b148b45cb528c04 $(echo -n 'value 1' | sha256sum | cut -d' ' -f1)" | sha256sum
# -> 0ef74638d6769055624139b2e746040b92ed9ea9275ac97ced9ac45f47091129
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
  "took": 8,
  "status": 201,
  "data": {
    "provable": {
      "id": "5798ca9721efce5365c2184b138217392fca6de77a2ea05ec727fb24531f71f1",
      "seed": "b197ddb42c27ba92027400881c94fb21779a76e56682c07bbdc09d6210d27202",
      "hash": "070def2915508fd43fe810fa584a59f881c37e3d6d114ea6d76faa397bb3e870",
      "address": "48b8efb0797795072d2dcfc98cb20c78eea0a050e5f1afb180cdfca8b141701e",
      "signature": "d37b31ac428ab51575d821d15cb6c31c02f0dd27ffdc24ed0e6e324a765eebe7",
      "chains": {},
      "previous": []
    },
    "timestamp": 1571151825516,
    "seed": "af858c0a41dae54942a3081ee2d33c5f0856e71c39190dc887af81fd841ad1e0",
    "hash": "e0a44d3c544c8895dacc7c32952766ee4db44122af955826e45c9486639ef5e4",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xbcb94922257b69fb5bf7bee76be9110100b569290e234b580f6ca8a96af477c37708eaf951ad2032bd3f9c453dc4d74e0db03cd554356ef95baccf4ea0ea0d801b",
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
  "took": 17,
  "status": 201,
  "data": {
    "provable": {
      "id": "bc23a8c9ac020f2436d28fadfda411bd7ce81ca43b532556424fc93194eafcf3",
      "seed": "1a7eecf3cb0b6f17f5c501a6365294a80dca90d803e0653319a1a73b6dc1b7c2",
      "hash": "518d653b5474921d61b4c82c8a04b92b107227b8e1c52811bc034d3a5d779a35",
      "address": "7b5402270ae8361bf7ed15d24fddc952bb9a80817be866c48ed5def424f51515",
      "signature": "79c8ba77731c12dc89e22a2c538dd3ce48a18b00574e12227ef12457062f721b",
      "chains": {},
      "previous": []
    },
    "timestamp": 1571151852125,
    "seed": "31db74baa4e13b4b78420f65c99d5cf3b183d4a68826e57fb30aa924aad3f741",
    "hash": "e0a44d3c544c8895dacc7c32952766ee4db44122af955826e45c9486639ef5e4",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xbcb94922257b69fb5bf7bee76be9110100b569290e234b580f6ca8a96af477c37708eaf951ad2032bd3f9c453dc4d74e0db03cd554356ef95baccf4ea0ea0d801b",
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
  "took": 12,
  "status": 201,
  "data": {
    "provable": {
      "id": "3599df4928022534c1c64927c4ed42d66041e7d7499dd7f0880e26a04ab2438f",
      "seed": "748ede869274ed4bc07ca7bb31b010c5f9efc49c4661f817e107a3a1fc8e9e17",
      "hash": "1b4e62322831c22356242eede297f4b913c018b386de3274c0e57369fa748836",
      "address": "7d563133c5af612ba34194453207a1570a5673d65dc169686cc2f996c4593739",
      "signature": "4105e84daa491277fce4d84cc8246a9ebb00e734648ee7cc7de41e69e43d9e67",
      "chains": {},
      "previous": []
    },
    "timestamp": 1571151866146,
    "seed": "5267bf7b3f0f68a8d189663c11c85cbb895a199c18450eed5aeeb51a6ff87693",
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
  "took": 6,
  "status": 201,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "4d14f4008f2ce219f86dc1dd87bb6a7fb3fc547908b48ddb58a83ee71d9c9f26",
      "hash": "9c4d80c2e1bf94859d745e0c468eb78031fcbcc5f1a1ffda001be9a5dd801960",
      "address": "db7f550216bc32196bd1cbab5d1b97ebf9cf1e0557763ba3db3b231a171b5cea",
      "signature": "6c8761a231a3a508505fe4f48d4cc37cf384b22ea08f9f9c876970963cfa5af1",
      "chains": {},
      "previous": []
    },
    "timestamp": 1571151881871,
    "seed": "b56c513cc629d7d8c19ee64539f68cddba5c1fc8b3432bf64eb39fdee76a4582",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
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
  "took": 4,
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
  "took": 9,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "4d14f4008f2ce219f86dc1dd87bb6a7fb3fc547908b48ddb58a83ee71d9c9f26",
      "hash": "9c4d80c2e1bf94859d745e0c468eb78031fcbcc5f1a1ffda001be9a5dd801960",
      "address": "db7f550216bc32196bd1cbab5d1b97ebf9cf1e0557763ba3db3b231a171b5cea",
      "signature": "6c8761a231a3a508505fe4f48d4cc37cf384b22ea08f9f9c876970963cfa5af1",
      "chains": {},
      "previous": []
    },
    "timestamp": 1571151881871,
    "seed": "b56c513cc629d7d8c19ee64539f68cddba5c1fc8b3432bf64eb39fdee76a4582",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
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
  "took": 106,
  "status": 201,
  "data": {
    "root": "2bf3f2813f2aa1938cb6639fd24878996a9cf47a37d4ff8f4de46e389f28d3ca",
    "index": 0,
    "timestamp": 1571151928840,
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
  "took": 26,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "4d14f4008f2ce219f86dc1dd87bb6a7fb3fc547908b48ddb58a83ee71d9c9f26",
      "hash": "9c4d80c2e1bf94859d745e0c468eb78031fcbcc5f1a1ffda001be9a5dd801960",
      "address": "db7f550216bc32196bd1cbab5d1b97ebf9cf1e0557763ba3db3b231a171b5cea",
      "signature": "6c8761a231a3a508505fe4f48d4cc37cf384b22ea08f9f9c876970963cfa5af1",
      "chains": {},
      "previous": []
    },
    "timestamp": 1571151881871,
    "seed": "b56c513cc629d7d8c19ee64539f68cddba5c1fc8b3432bf64eb39fdee76a4582",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "chains": {},
    "data": "dmFsdWUgNQ==",
    "block": {
      "root": "2bf3f2813f2aa1938cb6639fd24878996a9cf47a37d4ff8f4de46e389f28d3ca",
      "proof": [
        "f891808080a0ffb18e9afd670652adbc3d82a52e7ecc3e0cf75a6fac1763ab7cfd5517c981f180a09b462093ea0c96db04f56486175aa81405c0d3b7996c800615125f6892a8704080a046c7ac3cfa02abb96c2f65deb3435bf88a7435a965d74fe785e1eb716e5ed317808080a05be34f58353141d7a33e31113b3fa5b0d0084de42fa899d18391193586cd73108080808080",
        "f8718080808080a0bae0dc6cc3ec8f5826e2a2a8090d2e28dd4add7ecdd5731ee32b7b86fef7dab380808080a0b524eb927e2c937ae8a0e982f90ab517d3714add3c59a0cd1f4c2a2ef67ae773808080a07bf44a272885f4170b1ba7f530537471e396a8b4d6975eab8b0d7b60ec63c1978080",
        "f842a02031d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a05d3e88a26dda76f9bfc22cebf09454349f44c71c9161017965521133a0ecd4fd"
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
  "took": 5,
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
  "took": 16,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "4d14f4008f2ce219f86dc1dd87bb6a7fb3fc547908b48ddb58a83ee71d9c9f26",
      "hash": "9c4d80c2e1bf94859d745e0c468eb78031fcbcc5f1a1ffda001be9a5dd801960",
      "address": "db7f550216bc32196bd1cbab5d1b97ebf9cf1e0557763ba3db3b231a171b5cea",
      "signature": "6c8761a231a3a508505fe4f48d4cc37cf384b22ea08f9f9c876970963cfa5af1",
      "chains": {},
      "previous": []
    },
    "timestamp": 1571151881871,
    "seed": "b56c513cc629d7d8c19ee64539f68cddba5c1fc8b3432bf64eb39fdee76a4582",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "chains": {},
    "block": {
      "root": "2bf3f2813f2aa1938cb6639fd24878996a9cf47a37d4ff8f4de46e389f28d3ca",
      "proof": [
        "f891808080a0ffb18e9afd670652adbc3d82a52e7ecc3e0cf75a6fac1763ab7cfd5517c981f180a09b462093ea0c96db04f56486175aa81405c0d3b7996c800615125f6892a8704080a046c7ac3cfa02abb96c2f65deb3435bf88a7435a965d74fe785e1eb716e5ed317808080a05be34f58353141d7a33e31113b3fa5b0d0084de42fa899d18391193586cd73108080808080",
        "f8718080808080a0bae0dc6cc3ec8f5826e2a2a8090d2e28dd4add7ecdd5731ee32b7b86fef7dab380808080a0b524eb927e2c937ae8a0e982f90ab517d3714add3c59a0cd1f4c2a2ef67ae773808080a07bf44a272885f4170b1ba7f530537471e396a8b4d6975eab8b0d7b60ec63c1978080",
        "f842a02031d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a05d3e88a26dda76f9bfc22cebf09454349f44c71c9161017965521133a0ecd4fd"
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
  "took": 12,
  "status": 201,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "063cacc432db50d519f895be2f93d410ad8de88c6ca3ffd76df76d0bfad4eb24",
      "hash": "4e06d7efec1682fbdb08afb14ebe8e220d47131cc47bcd71f718e777c8ac7791",
      "address": "92b9253ba8cfa3eefd0f66797a95cc021f1f4c586019b2e0e4b4b612a82fa490",
      "signature": "e8fafca06683ec083e5cef63c4df5250909298f9df4684d1243e5473394cfb4c",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "timestamp": 1571151984803,
    "seed": "32392eeecca5f31b83f08cb425e676fc62f1b439702b9426c1059dc80168033b",
    "hash": "5b193ff1cf8ac2f1aabe5fe7de85debb29e8f337bc89b135a590c1073800cf80",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xa6bbc4cc1e50088492dc482801c4d4695d14f367b3b10e34f93a962e1a8213b634b7bfa6a95edc6bbc25a359cf9a4554d6dee72078a671f401b6aa667dcb1ab31c",
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
  "took": 10,
  "status": 201,
  "data": {
    "provable": {
      "id": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951",
      "seed": "a5c99e46db2a7ef8a151fcefaa2b9841b6995daf9f92376875224a40b0c5171c",
      "hash": "87b372dfc4b7bcaa87c9672bb9e09238a379cb5c8b655d85da47fd325dcc39ed",
      "address": "47f4bcedf7ff986bc5c95c37fac0c353f33474ca323667e64a6023fc51a4cda3",
      "signature": "bb36cc5842f027d772d9a4d6098157dccef08e19d902a64e814a8614e2f0c4f6",
      "chains": {
        "669970e0a990ff392d41f4d5fe2aa099361bc19ef5ed973bb83859663bea9aad": null
      },
      "previous": []
    },
    "timestamp": 1571151997582,
    "seed": "54685a5b0533bc78e3e40c60852b95f460bc567a4a3fd765b43f382e57d6f7ae",
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
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=2B6C83EF-474D-4A15-B1D5-A1EC7E8226CF&chain=chain1&store=true" -d "value 8"
```

```json
{
  "took": 42,
  "status": 201,
  "data": {
    "provable": {
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "seed": "11005f0238ce122f5b3a01241da10608a8380d8403348c007743e56c406fe204",
      "hash": "44069a8148e9c176a8e37c0728888b756d9928ad1cf27328f0e89833382d31d1",
      "address": "708c25e47c3509affddcc19b1c7172c099c83fe4e4c0d233a4b6200ce77f11a7",
      "signature": "8852e2a566774051f5b2788d9dfdbbaf4d7e3953d7dd77ec9f52aca95fd70b96",
      "chains": {
        "93c8d170cdd9471bbef6f0a8a7b6d1ca69cdd596ced67e537bb9fe5a125a735e": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1571152008826,
    "seed": "668d0d3ba0b61785fa230742ac03687c44047b50878bc930b3559ecd3f38c84d",
    "hash": "1bb1c73103ef6ae888ab45afa617f8ec63f21bf959a284363d7a83055ac4f87d",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x13f6c3fbc6513cd9dbeca59878613ea10f2356bf5fcc75d15b8993ceb5cb56156b11668c316505ba817f8ab2a0edb24b555de3442865ee336f0b9f3cad8634ae1b",
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    },
    "data": "dmFsdWUgOA=="
  }
}
```

The field `chains` contains the key `chain1` whose value is the record identifier of the previously inserted record. The record has been appended at the end of the chain and the label `chain1` now refers to the newly inserted record. This information is provable because it is part of the record definition. The key stored in `provable.chains` has been obfuscated to avoid any data leak. `chains.chain1` can be removed by deleting the entire chain.

We can check that:
- the obfuscated fingerprint of `chain1` is equal to `93c8d170cdd9471bbef6f0a8a7b6d1ca69cdd596ced67e537bb9fe5a125a735e`:
```bash
echo -n "668d0d3ba0b61785fa230742ac03687c44047b50878bc930b3559ecd3f38c84d chain1" | sha256sum
```
- the `chains.chain1` value is equal to the `provable.chains.93c8d170cdd9471bbef6f0a8a7b6d1ca69cdd596ced67e537bb9fe5a125a735e` value: `893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951`.

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
      "seed": "11005f0238ce122f5b3a01241da10608a8380d8403348c007743e56c406fe204",
      "hash": "44069a8148e9c176a8e37c0728888b756d9928ad1cf27328f0e89833382d31d1",
      "address": "708c25e47c3509affddcc19b1c7172c099c83fe4e4c0d233a4b6200ce77f11a7",
      "signature": "8852e2a566774051f5b2788d9dfdbbaf4d7e3953d7dd77ec9f52aca95fd70b96",
      "chains": {
        "93c8d170cdd9471bbef6f0a8a7b6d1ca69cdd596ced67e537bb9fe5a125a735e": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1571152008826,
    "seed": "668d0d3ba0b61785fa230742ac03687c44047b50878bc930b3559ecd3f38c84d",
    "hash": "1bb1c73103ef6ae888ab45afa617f8ec63f21bf959a284363d7a83055ac4f87d",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x13f6c3fbc6513cd9dbeca59878613ea10f2356bf5fcc75d15b8993ceb5cb56156b11668c316505ba817f8ab2a0edb24b555de3442865ee336f0b9f3cad8634ae1b",
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
  "took": 23,
  "status": 201,
  "data": {
    "provable": {
      "id": "731eaa99597e5724f023ecd1573c4b9413b7e9cade8bc06ca86d0aaa43b71741",
      "seed": "ea357f74ebd4a3118ccdd95e47476364cdadd6181bba9f2daddd1bea3705bab2",
      "hash": "efc48eb9770011b19d6d8432bd064ce48f1aa178eb2dfdbc94db8c912bfa1c42",
      "address": "f57aeae6ea9c884ef89d48557d0671cf52180747b462252ec4528ab4f0e87088",
      "signature": "4808e931371df1532e22c2642b63f1dc24541826dfa405a00955688eb6edde6b",
      "chains": {
        "5de3181cfb36f2c1ed0d7f41ff92d6c0bad9c3cbb22b72ccb2e9416ac745a30f": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "aef76a8c9b35851c5431ecce57d44f5d2922aa7b7113c441978e1e86ed491639": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1571152133319,
    "seed": "5425d41f2c4badb12db73080132e35e28f2f04e956b2237e32bffdd81b3f199c",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
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
      "id": "731eaa99597e5724f023ecd1573c4b9413b7e9cade8bc06ca86d0aaa43b71741",
      "seed": "ea357f74ebd4a3118ccdd95e47476364cdadd6181bba9f2daddd1bea3705bab2",
      "hash": "efc48eb9770011b19d6d8432bd064ce48f1aa178eb2dfdbc94db8c912bfa1c42",
      "address": "f57aeae6ea9c884ef89d48557d0671cf52180747b462252ec4528ab4f0e87088",
      "signature": "4808e931371df1532e22c2642b63f1dc24541826dfa405a00955688eb6edde6b",
      "chains": {
        "5de3181cfb36f2c1ed0d7f41ff92d6c0bad9c3cbb22b72ccb2e9416ac745a30f": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "aef76a8c9b35851c5431ecce57d44f5d2922aa7b7113c441978e1e86ed491639": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1571152133319,
    "seed": "5425d41f2c4badb12db73080132e35e28f2f04e956b2237e32bffdd81b3f199c",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
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
  "took": 2,
  "status": 200,
  "data": {
    "provable": {
      "id": "731eaa99597e5724f023ecd1573c4b9413b7e9cade8bc06ca86d0aaa43b71741",
      "seed": "ea357f74ebd4a3118ccdd95e47476364cdadd6181bba9f2daddd1bea3705bab2",
      "hash": "efc48eb9770011b19d6d8432bd064ce48f1aa178eb2dfdbc94db8c912bfa1c42",
      "address": "f57aeae6ea9c884ef89d48557d0671cf52180747b462252ec4528ab4f0e87088",
      "signature": "4808e931371df1532e22c2642b63f1dc24541826dfa405a00955688eb6edde6b",
      "chains": {
        "5de3181cfb36f2c1ed0d7f41ff92d6c0bad9c3cbb22b72ccb2e9416ac745a30f": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "aef76a8c9b35851c5431ecce57d44f5d2922aa7b7113c441978e1e86ed491639": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1571152133319,
    "seed": "5425d41f2c4badb12db73080132e35e28f2f04e956b2237e32bffdd81b3f199c",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
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
  "took": 2,
  "status": 200,
  "data": {
    "provable": {
      "id": "731eaa99597e5724f023ecd1573c4b9413b7e9cade8bc06ca86d0aaa43b71741",
      "seed": "ea357f74ebd4a3118ccdd95e47476364cdadd6181bba9f2daddd1bea3705bab2",
      "hash": "efc48eb9770011b19d6d8432bd064ce48f1aa178eb2dfdbc94db8c912bfa1c42",
      "address": "f57aeae6ea9c884ef89d48557d0671cf52180747b462252ec4528ab4f0e87088",
      "signature": "4808e931371df1532e22c2642b63f1dc24541826dfa405a00955688eb6edde6b",
      "chains": {
        "5de3181cfb36f2c1ed0d7f41ff92d6c0bad9c3cbb22b72ccb2e9416ac745a30f": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "aef76a8c9b35851c5431ecce57d44f5d2922aa7b7113c441978e1e86ed491639": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1571152133319,
    "seed": "5425d41f2c4badb12db73080132e35e28f2f04e956b2237e32bffdd81b3f199c",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
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
  "took": 4,
  "status": 200,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "063cacc432db50d519f895be2f93d410ad8de88c6ca3ffd76df76d0bfad4eb24",
      "hash": "4e06d7efec1682fbdb08afb14ebe8e220d47131cc47bcd71f718e777c8ac7791",
      "address": "92b9253ba8cfa3eefd0f66797a95cc021f1f4c586019b2e0e4b4b612a82fa490",
      "signature": "e8fafca06683ec083e5cef63c4df5250909298f9df4684d1243e5473394cfb4c",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "timestamp": 1571151984803,
    "seed": "32392eeecca5f31b83f08cb425e676fc62f1b439702b9426c1059dc80168033b",
    "hash": "5b193ff1cf8ac2f1aabe5fe7de85debb29e8f337bc89b135a590c1073800cf80",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xa6bbc4cc1e50088492dc482801c4d4695d14f367b3b10e34f93a962e1a8213b634b7bfa6a95edc6bbc25a359cf9a4554d6dee72078a671f401b6aa667dcb1ab31c",
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
  "took": 28,
  "status": 201,
  "data": {
    "root": "0614d8724020a4321112d36b2e259156d438501054bbac76b38b288557035b58",
    "index": 1,
    "timestamp": 1571152209406,
    "count": 1,
    "previous": {
      "root": "2bf3f2813f2aa1938cb6639fd24878996a9cf47a37d4ff8f4de46e389f28d3ca",
      "proof": [
        "e217a0e666bc6a9d88bbc07035e1a3f34c357e0f7310777f9442c30152b100f1b351ce",
        "f851a00bb7aceb1f31c19d2a0826cc9953d1d9925a6a9332a591ba7934968c3c6babd980808080a07cabdd0583ab226afbbd61d51969c82859044363e102ad419cf928bf807cfdd98080808080808080808080",
        "ea8820726576696f7573a02bf3f2813f2aa1938cb6639fd24878996a9cf47a37d4ff8f4de46e389f28d3ca"
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
    - `root` is the root hash of the previous block;
    - `proof` is the associated proof in this block.

To create a block without any limit on the number of record that it will contain you can run the same API call without the `max` parameter.

```bash
curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 48,
  "status": 201,
  "data": {
    "root": "5c4640ef9e53642b04443bf98fbdfb8817b1d79d8366d435b0bb8e3eb25c3640",
    "index": 2,
    "timestamp": 1571152231982,
    "count": 3,
    "previous": {
      "root": "0614d8724020a4321112d36b2e259156d438501054bbac76b38b288557035b58",
      "proof": [
        "f87180808080a05bfb73e2025fb8f2c557efa94808230bd9644184a5dcb4d704e59e40230bcd398080a02c03586d103060bcda2079fc6c56668c9022e9d5aa3e1c2da97afb43a3db12d1a0b2730cf2a3089fd694b555002701692d400c57873ac5d731878ca7759fe446e58080808080808080",
        "f851a0902f7c5f554cda1ea692b5f016fb134c40e815313b497363013546d67c6b880f8080a05600f2a5c34caf00711fc6142568ba873b444867c9a22218c440325a3d37f1f180808080808080808080808080",
        "ea8820726576696f7573a00614d8724020a4321112d36b2e259156d438501054bbac76b38b288557035b58"
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
  "took": 28,
  "status": 201,
  "data": {
    "root": "2beea2809ec0334c991fcf3baf7a42dab0bdc41e7007cbf234f3cd9695531980",
    "index": 3,
    "timestamp": 1571152245928,
    "count": 0,
    "previous": {
      "root": "5c4640ef9e53642b04443bf98fbdfb8817b1d79d8366d435b0bb8e3eb25c3640",
      "proof": [
        "eb892070726576696f7573a05c4640ef9e53642b04443bf98fbdfb8817b1d79d8366d435b0bb8e3eb25c3640"
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
  "took": 17,
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
  "took": 3,
  "status": 200,
  "data": {
    "previous": {
      "root": "2beea2809ec0334c991fcf3baf7a42dab0bdc41e7007cbf234f3cd9695531980",
      "index": 3,
      "timestamp": 1571152245928,
      "count": 0,
      "previous": {
        "root": "5c4640ef9e53642b04443bf98fbdfb8817b1d79d8366d435b0bb8e3eb25c3640",
        "proof": [
          "eb892070726576696f7573a05c4640ef9e53642b04443bf98fbdfb8817b1d79d8366d435b0bb8e3eb25c3640"
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
  "took": 3,
  "status": 200,
  "data": {
    "root": "0614d8724020a4321112d36b2e259156d438501054bbac76b38b288557035b58",
    "index": 1,
    "timestamp": 1571152209406,
    "count": 1,
    "previous": {
      "root": "2bf3f2813f2aa1938cb6639fd24878996a9cf47a37d4ff8f4de46e389f28d3ca",
      "proof": [
        "e217a0e666bc6a9d88bbc07035e1a3f34c357e0f7310777f9442c30152b100f1b351ce",
        "f851a00bb7aceb1f31c19d2a0826cc9953d1d9925a6a9332a591ba7934968c3c6babd980808080a07cabdd0583ab226afbbd61d51969c82859044363e102ad419cf928bf807cfdd98080808080808080808080",
        "ea8820726576696f7573a02bf3f2813f2aa1938cb6639fd24878996a9cf47a37d4ff8f4de46e389f28d3ca"
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
  "took": 3,
  "status": 200,
  "data": {
    "root": "2bf3f2813f2aa1938cb6639fd24878996a9cf47a37d4ff8f4de46e389f28d3ca",
    "index": 0,
    "timestamp": 1571151928840,
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
