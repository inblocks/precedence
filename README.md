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
  "took": 23,
  "status": 201,
  "data": {
    "provable": {
      "id": "1812bc3ae786c74d3d8ecf364863a2446e0b2b2dcc6d0b2fe20465d886274d07",
      "seed": "f2d2aec4cf8132c9aa42f4807eb0df83b2a5fbfa339324c0fdf464bc7a20d08d",
      "hash": "67e14e16ee27e352569f7785062263a71c49c9c6b126e48f7103da110d5d0ae7",
      "address": "346fca96d872c6955b3e1294090376e652b7d4eaed03b34370124e44b9efc34d",
      "signature": "9cf6926956d9e15dfffb1507715cdad99287f55039d09b7de5c4724088bb7275",
      "chains": {},
      "previous": []
    },
    "timestamp": 1561537030060,
    "seed": "b496b87c4b27f16f5a11bad36afbf4ee318cee1b2378d1a1962a6917e2c5b78e",
    "hash": "65da867639080176b5998c77219e2745474aa518a04268522467322f06fbd9d9",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x77fcbaa4d47659e3804d337b04778264b24eed02cf3efcbf22450b9c9128a0400865d6d5187a21bae371f0ef59b17144fac38203263d3896b6110887986ac6d91b",
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
echo -n 'b496b87c4b27f16f5a11bad36afbf4ee318cee1b2378d1a1962a6917e2c5b78e b496b87c4b27f16f5a11bad36afbf4ee318cee1b2378d1a1962a6917e2c5b78e' | sha256sum
# -> f2d2aec4cf8132c9aa42f4807eb0df83b2a5fbfa339324c0fdf464bc7a20d08d
```
- the obfuscated fingerprint of the hash is equal to `provable.hash` value:
```bash
echo -n "b496b87c4b27f16f5a11bad36afbf4ee318cee1b2378d1a1962a6917e2c5b78e $(echo -n 'value 1' | sha256sum | cut -d' ' -f1)" | sha256sum
# -> 67e14e16ee27e352569f7785062263a71c49c9c6b126e48f7103da110d5d0ae7
```
- the signature is valid with [https://etherscan.io/verifySig](https://etherscan.io/verifySig):
  - [Step 1] Address: `0x4592350babefcc849943db091b6c49f8b86f8aaa`;
  - [Step 2] Message Signature Hash: `0x77fcbaa4d47659e3804d337b04778264b24eed02cf3efcbf22450b9c9128a0400865d6d5187a21bae371f0ef59b17144fac38203263d3896b6110887986ac6d91b`;
  - [Step 3] Enter the original message that was signed: `65da867639080176b5998c77219e2745474aa518a04268522467322f06fbd9d9`;
  - Verify: `Message Signature Verified`.
---

Let's create another record with the `store=true` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```

```json
{
  "took": 17,
  "status": 201,
  "data": {
    "provable": {
      "id": "006fbf81402d940b11db2b59d4bc2677bfe35e3d7ab046b8b9960fe59b12d96d",
      "seed": "3785479be144c0084ab462f8a3c83c8d3d9b5c99882e0494c3f932ba50ad1663",
      "hash": "95aedbd32dace685b99ec5bd6b8a686fbaaa45bd37aa09d61a2fdf41d00ae7c7",
      "address": "ecea42ce74d4e7de167e37b1a4b1f3bb3cf0437ed0256d5ca253fa47b6ed52fa",
      "signature": "4e03d1a139e57a18f7f230d22ccd3ee58a7abc5452971e3440da29ec98ec6ff6",
      "chains": {},
      "previous": []
    },
    "timestamp": 1561538895101,
    "seed": "45f5de786f15f9e9862ace4f6f5f34668a9a16484ede0055e01219746adbf071",
    "hash": "e0a44d3c544c8895dacc7c32952766ee4db44122af955826e45c9486639ef5e4",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xd48f588aa65721392a0002480b4908302ebafd3317a73dcfb472b2b8ca0b1fdf2f43583fa7aa8b4e02cc1d7f347b6b25c00ab1c4397e2af0af3a1f2069f0c5001c",
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
  "took": 19,
  "status": 201,
  "data": {
    "provable": {
      "id": "23e50b05ed886970faccf6382b6734cfee14e0bcaccf10992b9eaea0541abde8",
      "seed": "7cc21754cf3ebe5ac99bb573dcfc142352984d3501688e35e9fdfded28183350",
      "hash": "91859f49a3e4bcc261661f4ad127afe1089ecc24231af40d2f6200b2dd333993",
      "address": "85a39fa416f988660f2865b23b8d581bdab3f21aab548cd9b8f4a78f1ff1b872",
      "signature": "3ad2a2f13dc02f4ac921e0d536e7537e4ef79fded6652c14c01c25b4e9f68661",
      "chains": {},
      "previous": []
    },
    "timestamp": 1561538910015,
    "seed": "b6b9bd9456316121326c345f47c4b55a26bb27129e775629c1481d96ccc2f324",
    "hash": "e0a44d3c544c8895dacc7c32952766ee4db44122af955826e45c9486639ef5e4",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xd48f588aa65721392a0002480b4908302ebafd3317a73dcfb472b2b8ca0b1fdf2f43583fa7aa8b4e02cc1d7f347b6b25c00ab1c4397e2af0af3a1f2069f0c5001c",
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
  "took": 14,
  "status": 201,
  "data": {
    "provable": {
      "id": "9addb6a08e9237ebdb69e024c749057e72e6776f248b257aafd691d5c72420e1",
      "seed": "35067141f952fe53cadf96b6d8a76cc4c327f7784d0ac7c9ec60af259727f7eb",
      "hash": "5739dfdced0483bbc074832f68e502caff0e616aa6ea0694bc7caf09a53bb40f",
      "address": "d9e793db160bc78f22e80631aaf77dc74bf047010ec6db652a27bcb3dea6bab3",
      "signature": "d1251a1c2f58555a9bc2afee9f48ec4e82b539c09e4a50cef7f2769070ef5043",
      "chains": {},
      "previous": []
    },
    "timestamp": 1561538935711,
    "seed": "ab8ede71416a1a046567283b9795dc7504afd6d39b78774f86b398c0b2e80b86",
    "hash": "085a57ddb929d1a2853aad31940d6e718918762b8db43f299e86fe732d13d6b9",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x90bade3a276e593058efaee4ba0a6e42b438504c550881adf4171ebbf1e46a2562562e321b0589237feeaeac04907a83d7cf1f724ac796d5b6aa3e5a221a07581c",
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
  "took": 16,
  "status": 201,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "90588f44c4a6f06afe439975d5f8b02adb96f3f51766cc1edcb68833e522d45f",
      "hash": "ef070eeaea3484469a122936aaebef2b6691aa102214258a3db85436158b393a",
      "address": "cb5b88819991a4012c1eeb6d682218a7e13ed3c31108b1147553e6bc4a68aae5",
      "signature": "bb0d72a379bf5c4e815c9cac60f921629c725d7b1fae2962bbea0e5ef8a6c173",
      "chains": {},
      "previous": []
    },
    "timestamp": 1561538964626,
    "seed": "7d159e8715e23696785341484c7b46d168799790a353bf18cd297c6c3f613c73",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xdb80ef509ff9936369c88442f1c20e7c7508b1d8337138b63d673229ddf379ef4ac56a98ba87f69e5d18a436c76a1c2688370c051336f8a3e931a9243b57a7d81b",
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
  "took": 11,
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
      "seed": "90588f44c4a6f06afe439975d5f8b02adb96f3f51766cc1edcb68833e522d45f",
      "hash": "ef070eeaea3484469a122936aaebef2b6691aa102214258a3db85436158b393a",
      "address": "cb5b88819991a4012c1eeb6d682218a7e13ed3c31108b1147553e6bc4a68aae5",
      "signature": "bb0d72a379bf5c4e815c9cac60f921629c725d7b1fae2962bbea0e5ef8a6c173",
      "chains": {},
      "previous": []
    },
    "timestamp": 1561538964626,
    "seed": "7d159e8715e23696785341484c7b46d168799790a353bf18cd297c6c3f613c73",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xdb80ef509ff9936369c88442f1c20e7c7508b1d8337138b63d673229ddf379ef4ac56a98ba87f69e5d18a436c76a1c2688370c051336f8a3e931a9243b57a7d81b",
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
  "took": 93,
  "status": 201,
  "data": {
    "root": "9e138e4dd388a80ef2019f61d0aa2b1a2845ee2bd795dd5de7bc87745b040efe",
    "index": 0,
    "timestamp": "1561539000946",
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
  "took": 21,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "90588f44c4a6f06afe439975d5f8b02adb96f3f51766cc1edcb68833e522d45f",
      "hash": "ef070eeaea3484469a122936aaebef2b6691aa102214258a3db85436158b393a",
      "address": "cb5b88819991a4012c1eeb6d682218a7e13ed3c31108b1147553e6bc4a68aae5",
      "signature": "bb0d72a379bf5c4e815c9cac60f921629c725d7b1fae2962bbea0e5ef8a6c173",
      "chains": {},
      "previous": []
    },
    "timestamp": 1561538964626,
    "seed": "7d159e8715e23696785341484c7b46d168799790a353bf18cd297c6c3f613c73",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xdb80ef509ff9936369c88442f1c20e7c7508b1d8337138b63d673229ddf379ef4ac56a98ba87f69e5d18a436c76a1c2688370c051336f8a3e931a9243b57a7d81b",
    "chains": {},
    "data": "dmFsdWUgNQ==",
    "block": {
      "root": "9e138e4dd388a80ef2019f61d0aa2b1a2845ee2bd795dd5de7bc87745b040efe",
      "proof": [
        "f8d1a078ff96f7bf777bfab5fe64d506e0876f64c53a9dbb593a21899525dfa5c74572a0a44b5d65dac1aeda03eea0911a80cba8f4e331b788a1dbed6e50cb2a3c1ba801a0ee4153966b8bc020d968edd5ebd55f95194d8a00af0abefa202801b8b0d7fe08a0e85e1d2fe6acc43bc49b8874b85e6a0525ce5b48b00105fec3c59b4b82fd50d2808080a012e31e9b9329ca4ec13723f4ed0639d7297b1718118ed0f98280762a1d08adcc80a01b1d1feb52fd96b0836d387d260c76e754fc41d01994a82892b4606b5384ff2780808080808080",
        "f842a03a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a0fffa007b2555c4a3cd5e2d54db17f81d210461630b5cd18baa823e1caf053923"
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
  "took": 23,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "90588f44c4a6f06afe439975d5f8b02adb96f3f51766cc1edcb68833e522d45f",
      "hash": "ef070eeaea3484469a122936aaebef2b6691aa102214258a3db85436158b393a",
      "address": "cb5b88819991a4012c1eeb6d682218a7e13ed3c31108b1147553e6bc4a68aae5",
      "signature": "bb0d72a379bf5c4e815c9cac60f921629c725d7b1fae2962bbea0e5ef8a6c173",
      "chains": {},
      "previous": []
    },
    "timestamp": 1561538964626,
    "seed": "7d159e8715e23696785341484c7b46d168799790a353bf18cd297c6c3f613c73",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xdb80ef509ff9936369c88442f1c20e7c7508b1d8337138b63d673229ddf379ef4ac56a98ba87f69e5d18a436c76a1c2688370c051336f8a3e931a9243b57a7d81b",
    "chains": {},
    "block": {
      "root": "9e138e4dd388a80ef2019f61d0aa2b1a2845ee2bd795dd5de7bc87745b040efe",
      "proof": [
        "f8d1a078ff96f7bf777bfab5fe64d506e0876f64c53a9dbb593a21899525dfa5c74572a0a44b5d65dac1aeda03eea0911a80cba8f4e331b788a1dbed6e50cb2a3c1ba801a0ee4153966b8bc020d968edd5ebd55f95194d8a00af0abefa202801b8b0d7fe08a0e85e1d2fe6acc43bc49b8874b85e6a0525ce5b48b00105fec3c59b4b82fd50d2808080a012e31e9b9329ca4ec13723f4ed0639d7297b1718118ed0f98280762a1d08adcc80a01b1d1feb52fd96b0836d387d260c76e754fc41d01994a82892b4606b5384ff2780808080808080",
        "f842a03a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a0fffa007b2555c4a3cd5e2d54db17f81d210461630b5cd18baa823e1caf053923"
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
  "took": 17,
  "status": 201,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "9f15f0f09c25dcbee008b99392e658cf5f57d7ac8ea9995cf93f541844e2f04e",
      "hash": "ed14d252c83b8f8d9fa4b7263f68d457c951f1d11624a68631e2bba52220ef26",
      "address": "1d35075fa1c6fbde0c15a291f76dc92708d61b2a8fd1f770bd4bce31e7660ede",
      "signature": "92336c7c48d18971a476c71e83b5322ef63837dc31d9b946aa397f859e325877",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "timestamp": 1561539045757,
    "seed": "fa0cbc373eaae4b33d12d1b4f34bb6afa1b6e6a341d50fff5acfe5dc95145553",
    "hash": "5b193ff1cf8ac2f1aabe5fe7de85debb29e8f337bc89b135a590c1073800cf80",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x27144f07e39fe4c8541f707094b851523da322b7f22fc1dba52bbb6c9c5d605d79895b191dd1da16de4d05d3fee04fd0c07bc5db4cee89ce24b5608e926989891c",
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
  "took": 20,
  "status": 201,
  "data": {
    "provable": {
      "id": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951",
      "seed": "08f0dba4e37fec687bd801744a7a896c9bf3d9d2049ba81ffb35e77aa2cb62c4",
      "hash": "3a56a719e8da4c12e387c66cc62d734236ce9d8c0142afcb40b2104140da4a72",
      "address": "24c273c8c82b460381f93c64c14374d359f0c4c4c4f994161e6dacaf4e305f21",
      "signature": "1896d910470b71c9df33a7ad1f3dcdc12a25c6b2852172d7990b54d216a87a34",
      "chains": {
        "c388995cabb31984faee055bed7d95e23faef0600736ceb25a209ea5e51b3995": null
      },
      "previous": []
    },
    "timestamp": 1561539055854,
    "seed": "aa318fd81af27f3bc8a34f43621f530ba73f2535696fb02fb19ca141778e01eb",
    "hash": "ed914881e913845413125b682876d976b9eab7335980726ddc59f785beb4d5ad",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x95797ccb292915d33d8b0114175d4c2a000a6c4c2149a24929fbf5d7ad4f0bc11e0cf3ff6ee82f6925183ec4cf0ceedaf227990fac367f5d0b723a190661d2101b",
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
  "took": 16,
  "status": 201,
  "data": {
    "provable": {
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "seed": "d17a6ed9285a60fd6bef7833966958e98b45c4428688663aed1a1ef887deb144",
      "hash": "d52ed7d36af68c1856b506a3f4fdd91ea2fbf69c7f89116843bea0d740a95b06",
      "address": "b4536876a35a9210d37154cc03241945e09e038981095565c58a0a27cbdb3410",
      "signature": "abec25841a701334e670197528c57834003ad558a27b84b9d68dd37302c9bded",
      "chains": {
        "85965cac8c4efb5ff1ede107123b4c8810f5bc060aa0081635dded130f683cbc": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1561539065430,
    "seed": "c030d07148f8c7a9c7211800a81fd5bafcdda8632a673a334172ba1e2b9172ba",
    "hash": "1bb1c73103ef6ae888ab45afa617f8ec63f21bf959a284363d7a83055ac4f87d",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xb64142f5149eef1f011c4b0a951421444a0af892c76da0d1561564918f4bc8a61191c18a6b70dcc1bde0f4c4c5fa989950b5ec8c5fa460622fee5cf7967aef491b",
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    },
    "data": "dmFsdWUgOA=="
  }
}
```

The field `chains` contains the key `chain1` whose value is the record identifier of the previously inserted record. The record has been appended at the end of the chain and the label `chain1` now refers to the newly inserted record. This information is provable because it is part of the record definition. The key stored in `provable.chains` has been obfuscated to avoid any data leak. `chains.chain1` can be removed by deleting the entire chain.

We can check that:
- the obfuscated fingerprint of `chain1` is equal to `85965cac8c4efb5ff1ede107123b4c8810f5bc060aa0081635dded130f683cbc`:
```bash
echo -n "c030d07148f8c7a9c7211800a81fd5bafcdda8632a673a334172ba1e2b9172ba chain1" | sha256sum
```
- the `chains.chain1` value is equal to the `provable.chains.85965cac8c4efb5ff1ede107123b4c8810f5bc060aa0081635dded130f683cbc` value: `893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951`.

---

To retrieve the record currently refered by a chain name (i.e. the last record of the chain), you can use the following API call:

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 8,
  "status": 200,
  "data": {
    "provable": {
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "seed": "d17a6ed9285a60fd6bef7833966958e98b45c4428688663aed1a1ef887deb144",
      "hash": "d52ed7d36af68c1856b506a3f4fdd91ea2fbf69c7f89116843bea0d740a95b06",
      "address": "b4536876a35a9210d37154cc03241945e09e038981095565c58a0a27cbdb3410",
      "signature": "abec25841a701334e670197528c57834003ad558a27b84b9d68dd37302c9bded",
      "chains": {
        "85965cac8c4efb5ff1ede107123b4c8810f5bc060aa0081635dded130f683cbc": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1561539065430,
    "seed": "c030d07148f8c7a9c7211800a81fd5bafcdda8632a673a334172ba1e2b9172ba",
    "hash": "1bb1c73103ef6ae888ab45afa617f8ec63f21bf959a284363d7a83055ac4f87d",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xb64142f5149eef1f011c4b0a951421444a0af892c76da0d1561564918f4bc8a61191c18a6b70dcc1bde0f4c4c5fa989950b5ec8c5fa460622fee5cf7967aef491b",
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
  "took": 25,
  "status": 201,
  "data": {
    "provable": {
      "id": "a367a449990602b7765fab3f30cc70ca2a080f0ba93bbf67fdc5506fff80ec58",
      "seed": "014855f120faa4ace3c04ba956768db645d668cd89e2b54b2ddf5f597ac706c4",
      "hash": "67f1890d7e33b1e1bd2704d41032b0777884351bcb66a57fa158e1e92cf6e77a",
      "address": "58146a0d022f43515468d5b99ee8f3401377986eacdd8e53af65083ed5997644",
      "signature": "3ccb7c454d97c1a08469bc2e10d053be76f01d52e0a0e414c42b7957fe3b60c3",
      "chains": {
        "540e11e9364200d8d6d69baf9b6fb5e3d86ab27c50238f67ef56053c3924d15a": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "f3fc6277e188bb61026ad8ee0bb0e23ff48f3ca5a947bd30baca54ff8528112d": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1561539146359,
    "seed": "042ec24f715d98b26b641c4fa5b7658ba4ed77beabeb6706384bfe611ac653b8",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x12693c35b20a343d91bcdeb4a2d7e5fa9cafb935f445fa27f5130a7d56dc075c529196e2645d28d9dc4f258e90815129b48bcbab3e517b64d7f8ec4005cf5d071c",
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
  "took": 8,
  "status": 200,
  "data": {
    "provable": {
      "id": "a367a449990602b7765fab3f30cc70ca2a080f0ba93bbf67fdc5506fff80ec58",
      "seed": "014855f120faa4ace3c04ba956768db645d668cd89e2b54b2ddf5f597ac706c4",
      "hash": "67f1890d7e33b1e1bd2704d41032b0777884351bcb66a57fa158e1e92cf6e77a",
      "address": "58146a0d022f43515468d5b99ee8f3401377986eacdd8e53af65083ed5997644",
      "signature": "3ccb7c454d97c1a08469bc2e10d053be76f01d52e0a0e414c42b7957fe3b60c3",
      "chains": {
        "540e11e9364200d8d6d69baf9b6fb5e3d86ab27c50238f67ef56053c3924d15a": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "f3fc6277e188bb61026ad8ee0bb0e23ff48f3ca5a947bd30baca54ff8528112d": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1561539146359,
    "seed": "042ec24f715d98b26b641c4fa5b7658ba4ed77beabeb6706384bfe611ac653b8",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x12693c35b20a343d91bcdeb4a2d7e5fa9cafb935f445fa27f5130a7d56dc075c529196e2645d28d9dc4f258e90815129b48bcbab3e517b64d7f8ec4005cf5d071c",
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
  "took": 7,
  "status": 200,
  "data": {
    "provable": {
      "id": "a367a449990602b7765fab3f30cc70ca2a080f0ba93bbf67fdc5506fff80ec58",
      "seed": "014855f120faa4ace3c04ba956768db645d668cd89e2b54b2ddf5f597ac706c4",
      "hash": "67f1890d7e33b1e1bd2704d41032b0777884351bcb66a57fa158e1e92cf6e77a",
      "address": "58146a0d022f43515468d5b99ee8f3401377986eacdd8e53af65083ed5997644",
      "signature": "3ccb7c454d97c1a08469bc2e10d053be76f01d52e0a0e414c42b7957fe3b60c3",
      "chains": {
        "540e11e9364200d8d6d69baf9b6fb5e3d86ab27c50238f67ef56053c3924d15a": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "f3fc6277e188bb61026ad8ee0bb0e23ff48f3ca5a947bd30baca54ff8528112d": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1561539146359,
    "seed": "042ec24f715d98b26b641c4fa5b7658ba4ed77beabeb6706384bfe611ac653b8",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x12693c35b20a343d91bcdeb4a2d7e5fa9cafb935f445fa27f5130a7d56dc075c529196e2645d28d9dc4f258e90815129b48bcbab3e517b64d7f8ec4005cf5d071c",
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
  "took": 12,
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
  "took": 5,
  "status": 200,
  "data": {
    "provable": {
      "id": "a367a449990602b7765fab3f30cc70ca2a080f0ba93bbf67fdc5506fff80ec58",
      "seed": "014855f120faa4ace3c04ba956768db645d668cd89e2b54b2ddf5f597ac706c4",
      "hash": "67f1890d7e33b1e1bd2704d41032b0777884351bcb66a57fa158e1e92cf6e77a",
      "address": "58146a0d022f43515468d5b99ee8f3401377986eacdd8e53af65083ed5997644",
      "signature": "3ccb7c454d97c1a08469bc2e10d053be76f01d52e0a0e414c42b7957fe3b60c3",
      "chains": {
        "540e11e9364200d8d6d69baf9b6fb5e3d86ab27c50238f67ef56053c3924d15a": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "f3fc6277e188bb61026ad8ee0bb0e23ff48f3ca5a947bd30baca54ff8528112d": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1561539146359,
    "seed": "042ec24f715d98b26b641c4fa5b7658ba4ed77beabeb6706384bfe611ac653b8",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x12693c35b20a343d91bcdeb4a2d7e5fa9cafb935f445fa27f5130a7d56dc075c529196e2645d28d9dc4f258e90815129b48bcbab3e517b64d7f8ec4005cf5d071c",
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
  "took": 6,
  "status": 200,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "9f15f0f09c25dcbee008b99392e658cf5f57d7ac8ea9995cf93f541844e2f04e",
      "hash": "ed14d252c83b8f8d9fa4b7263f68d457c951f1d11624a68631e2bba52220ef26",
      "address": "1d35075fa1c6fbde0c15a291f76dc92708d61b2a8fd1f770bd4bce31e7660ede",
      "signature": "92336c7c48d18971a476c71e83b5322ef63837dc31d9b946aa397f859e325877",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "timestamp": 1561539045757,
    "seed": "fa0cbc373eaae4b33d12d1b4f34bb6afa1b6e6a341d50fff5acfe5dc95145553",
    "hash": "5b193ff1cf8ac2f1aabe5fe7de85debb29e8f337bc89b135a590c1073800cf80",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x27144f07e39fe4c8541f707094b851523da322b7f22fc1dba52bbb6c9c5d605d79895b191dd1da16de4d05d3fee04fd0c07bc5db4cee89ce24b5608e926989891c",
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
  "took": 50,
  "status": 201,
  "data": {
    "root": "c274597efab7039ea73acc9c82ecc65d12bd03bf4c1dc0f92bd79091ac421ba8",
    "index": 1,
    "timestamp": "1561539215861",
    "count": 1,
    "previous": {
      "root": "9e138e4dd388a80ef2019f61d0aa2b1a2845ee2bd795dd5de7bc87745b040efe",
      "proof": [
        "e217a0c472864036a5ee4bca83b39b74b8684f69abb73473a7e648b265cb6a824b0487",
        "f851a011bd0c718f2bda2d3833a22d7c9989764afdcbf93d9d2e004043346ebbc5b73480808080a00ab5b28cd3a4c7a57151de8b59621709dbf9a94a95b22f23aac121f43a1e9b1e8080808080808080808080",
        "ea8820726576696f7573a09e138e4dd388a80ef2019f61d0aa2b1a2845ee2bd795dd5de7bc87745b040efe"
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
  "took": 57,
  "status": 201,
  "data": {
    "root": "dd232fa54ae794b8d50b5898a801cde05dae12da9c7e6e0fa1c38da9883ca26d",
    "index": 2,
    "timestamp": "1561539226788",
    "count": 3,
    "previous": {
      "root": "c274597efab7039ea73acc9c82ecc65d12bd03bf4c1dc0f92bd79091ac421ba8",
      "proof": [
        "f89180808080a0f2b5a449fac28a88c659d1bdadbb508e87891f8542b72b035833f1fb88f7c9f98080a09e6abf7eb4458b5ac267c277fe93a4b8ada8cabf81cef51b8ad4796eb35f3ac5a0245ee93b2781135448455147e3ccee3f34e9a771d4d178cb30fa9536f69dff5f80a08b6f98ef39ddcea056f523d15415a1991098a587931510027a03e15355c1e7c5808080808080",
        "ea8830726576696f7573a0c274597efab7039ea73acc9c82ecc65d12bd03bf4c1dc0f92bd79091ac421ba8"
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
  "took": 30,
  "status": 201,
  "data": {
    "root": "01e878b5e4bc22e720830048eb974351b5acb694c31980e486be5784391a09e4",
    "index": 3,
    "timestamp": "1561539236342",
    "count": 0,
    "previous": {
      "root": "dd232fa54ae794b8d50b5898a801cde05dae12da9c7e6e0fa1c38da9883ca26d",
      "proof": [
        "eb892070726576696f7573a0dd232fa54ae794b8d50b5898a801cde05dae12da9c7e6e0fa1c38da9883ca26d"
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
  "took": 21,
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
    "index": 4,
    "previous": {
      "root": "01e878b5e4bc22e720830048eb974351b5acb694c31980e486be5784391a09e4",
      "timestamp": "1561539236342"
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
  "took": 4,
  "status": 200,
  "data": {
    "root": "c274597efab7039ea73acc9c82ecc65d12bd03bf4c1dc0f92bd79091ac421ba8",
    "index": 1,
    "timestamp": "1561539215861",
    "count": 1,
    "previous": {
      "root": "9e138e4dd388a80ef2019f61d0aa2b1a2845ee2bd795dd5de7bc87745b040efe",
      "proof": [
        "e217a0c472864036a5ee4bca83b39b74b8684f69abb73473a7e648b265cb6a824b0487",
        "f851a011bd0c718f2bda2d3833a22d7c9989764afdcbf93d9d2e004043346ebbc5b73480808080a00ab5b28cd3a4c7a57151de8b59621709dbf9a94a95b22f23aac121f43a1e9b1e8080808080808080808080",
        "ea8820726576696f7573a09e138e4dd388a80ef2019f61d0aa2b1a2845ee2bd795dd5de7bc87745b040efe"
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
  "took": 6,
  "status": 200,
  "data": {
    "root": "9e138e4dd388a80ef2019f61d0aa2b1a2845ee2bd795dd5de7bc87745b040efe",
    "index": 0,
    "timestamp": "1561539000946",
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
