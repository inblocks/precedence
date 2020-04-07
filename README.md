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
  "took": 34,
  "status": 201,
  "data": {
    "provable": {
      "id": "64154de4cc4186293b5ddd859f10331037afa08c4f25826c34ffaf7202ef3be5",
      "seed": "79497c7d52ff39e86270c77c084bd00feda4a9a38d56f13849ff4e9602a02820",
      "hash": "9558a2187a204a7de3986ecbbe8922b2e759655a095ca5fecf9548c659bb6aaa",
      "chains": {},
      "previous": [],
      "address": "dae4fe4f9c3b3cdc02d385f954b28020e8a3481468266f409ff344f2b7325644",
      "signature": "77b5471be67ce8441cebc09ba57e7583f94128d73fd4b62e6d5e98b02480051e"
    },
    "timestamp": 1585291815980,
    "seed": "c78193e055b36394ae5e79e7d3bd166f283513a7890c29f840b09b8772a221e7",
    "hash": "65da867639080176b5998c77219e2745474aa518a04268522467322f06fbd9d9",
    "chains": {},
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xcc8bfb566fe89bdc2b6bfce1e35886cda7cf790492b117f12696eeb8ce5bcd3278c7c43cdfcda56e82c70064d7fd02ecbdc3c73caad0a7371136b491c8b44a201b"
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
echo -n 'c78193e055b36394ae5e79e7d3bd166f283513a7890c29f840b09b8772a221e7 c78193e055b36394ae5e79e7d3bd166f283513a7890c29f840b09b8772a221e7' | sha256sum
```
- the obfuscated fingerprint of the hash is equal to `provable.hash` value:
```bash
echo -n "c78193e055b36394ae5e79e7d3bd166f283513a7890c29f840b09b8772a221e7 $(echo -n 'value 1' | sha256sum | cut -d' ' -f1)" | sha256sum
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
  "took": 27,
  "status": 201,
  "data": {
    "provable": {
      "id": "118935c138ff1c4f13131aa87049b6d7226b9aed9899607584fee1220150a57a",
      "seed": "5c6e2e37d4e2ec0b817b2ac3dbacff42a1146a05c5e1f4087f7630dd62f7c2c3",
      "hash": "6f6a449c999a1e1513077b6ca2e1ed2dbe5d51598ead3de8a9edc5df81807281",
      "chains": {},
      "previous": [],
      "address": "c8fe5fe4d123cb015a234b46cfd5c8d0e0f0dba11a353225772944d71ba97565",
      "signature": "65a7f8d9bfe771b53434126158690066d271162d9d227869016a7c18b78f3ccf"
    },
    "timestamp": 1585291816113,
    "seed": "1928d326c4506b46de2c1e56b70b0212aadee25c99d98e6e6371a8bf5c543032",
    "hash": "e0a44d3c544c8895dacc7c32952766ee4db44122af955826e45c9486639ef5e4",
    "chains": {},
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xbcb94922257b69fb5bf7bee76be9110100b569290e234b580f6ca8a96af477c37708eaf951ad2032bd3f9c453dc4d74e0db03cd554356ef95baccf4ea0ea0d801b",
    "data": {
      "bytes": 7
    }
  }
}
```

You can see that you have persisted 7 bytes in **_precedence_** (`data.bytes` field).

To retrieve the original data you can run: 

```bash
curl -XGET "$api/records/118935c138ff1c4f13131aa87049b6d7226b9aed9899607584fee1220150a57a?data=true"
```

---

Let's create the same original data again.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```
```json
{
  "took": 20,
  "status": 201,
  "data": {
    "provable": {
      "id": "8621aad5522abd884d7423073a1834768000ea840d5359ab087c233a769759c6",
      "seed": "2171ac6e1336fde4ba15a091a314ce0877293b2941f2ba1854e4c4bdd2793bc3",
      "hash": "43b115a3323307e95e74bd282c4be9fc80a840eeea41733529e9344a628dc922",
      "chains": {},
      "previous": [],
      "address": "20d52abca9a53aec9a1a19a97738a65ec54413f29afb4afee27fe08115205fea",
      "signature": "217a6f81634d3af6d2563716e9f957750f604ffe89bc7eb92a10d673a2259032"
    },
    "timestamp": 1585291816240,
    "seed": "5041615c6546c43707e679d093836bcc9703a4c253784574e6cd24ee1a2f2022",
    "hash": "e0a44d3c544c8895dacc7c32952766ee4db44122af955826e45c9486639ef5e4",
    "chains": {},
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xbcb94922257b69fb5bf7bee76be9110100b569290e234b580f6ca8a96af477c37708eaf951ad2032bd3f9c453dc4d74e0db03cd554356ef95baccf4ea0ea0d801b",
    "data": {
      "bytes": 7
    }
  }
}
```

All the values of the `provable` object are different from the previous one, even with the same original data. This is made possible by using the `seed` in the hashing process. This way the `provable` fields are 100% obfuscated and can not lead to data leaking.

---

It is possible to provide the fingerprint of the original data with the `hash` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&hash=5e2d78eb5107622b5441f53ac317fe431cebbfc2a04036c4ed820e11d54d6d1c" -d "value 3"
```

```json
{
  "took": 18,
  "status": 201,
  "data": {
    "provable": {
      "id": "a7474aed41c38b5eb9ecea1d98337d13ce2e1c3c63b60dc46c0731f497c5f0d6",
      "seed": "9b1ec7ca08767106f31480fd209d39259a125e6acd49a517836fd92397e0d4e0",
      "hash": "ae6277d897920893140cfba0598aac8ecc1b1810b4ca2431d21ee7fe3986c542",
      "chains": {},
      "previous": [],
      "address": "0874b3988c01ca31bfbf87326bbd2a55ff4f9f50e4b9f778d8e1de32e1702afd",
      "signature": "eaf6fa6e40f292920d26caf2b84955a1edb7e295ab5949ab80e9cbf5e8c3fd12"
    },
    "timestamp": 1585291816276,
    "seed": "c7826e859b3b2444490ba401fcae922302a121c417fc533e78b896f2ecfc3eeb",
    "hash": "5e2d78eb5107622b5441f53ac317fe431cebbfc2a04036c4ed820e11d54d6d1c",
    "chains": {},
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x33d5ba51b98e9956d813a52fe53ea726cf77877d38180f8a1754e077771b9a71465f4dd657d5a165a491cefa5663b2339e5dd82540e17c8df965d7350781d8361c"
  }
}
```

By doing so the received data fingerprint is compared to the provided one to make sure that the received data has not be altered by the network.

---

It is also possible to provide a fingerprint without the original data.

```bash
curl -XPOST "$api/records?pretty=true&hash=085a57ddb929d1a2853aad31940d6e718918762b8db43f299e86fe732d13d6b9"
```

```json
{
  "took": 15,
  "status": 201,
  "data": {
    "provable": {
      "id": "35aff33f67e1217466c9216673827abcb9e090232711308c71b090f8e6f1c97b",
      "seed": "92821da328b9f476842f4769f8d1fe14f5b27180230c29c5d4ab9ee79ec6a7b2",
      "hash": "a06a91fd450fcfc74bbedf068ea422aeafbe59e361914087be8d37569b554fde",
      "chains": {},
      "previous": [],
      "address": "b2369bdb9a8ba8f0d9f93500790efd06c72fa6d9987983c8c80ee86c0991889c",
      "signature": "48fc1cf35b98a80167808140cdc848d30558f3703ac5bcaa8f7c5cfea49aba64"
    },
    "timestamp": 1585291816309,
    "seed": "43d0d7244a50a9f7d0a2a59d56a5eb57581affe68267664c2c9cc23fe519d1f6",
    "hash": "085a57ddb929d1a2853aad31940d6e718918762b8db43f299e86fe732d13d6b9",
    "chains": {},
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x0335865798e357d8dbe4a851f387e2f091be6eca16d3909711a0450eb030323a12cf602f31b1635add36f2bd67a4bd5a49e175ac86c828b811a06c30c49b3fc21c"
  }
}
```

---

You can specify an identifier for your record. This identifier must be unique and so can not be attached to any other record.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true&id=E518B4BB-2668-4ED7-B9E3-E63803BCAC93" -d "value 5"
```

```json
{
  "took": 17,
  "status": 201,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "1d0f5522e5d08b728e785cecaafbaec283a3f78001e6970a1a6ba277b53679f2",
      "hash": "bd24e066707f10779aace889a9351625cfb8707dc2ec9df9fb62cbe6af0f1ad3",
      "chains": {},
      "previous": [],
      "address": "009fb3a5d7445889b48e6b537ff606bbb17e93db72603ddd96df93821626bc74",
      "signature": "26c778e11ffcb3e66d23b1af0547201d8fc957de125eca3a7edb3a6e02545f62"
    },
    "timestamp": 1585291816342,
    "seed": "7707068aeeb712847e9b804f02a89e3209e28ece806913a097a5220c412d4485",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "chains": {},
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
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
  "took": 8,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "1d0f5522e5d08b728e785cecaafbaec283a3f78001e6970a1a6ba277b53679f2",
      "hash": "bd24e066707f10779aace889a9351625cfb8707dc2ec9df9fb62cbe6af0f1ad3",
      "chains": {},
      "previous": [],
      "address": "009fb3a5d7445889b48e6b537ff606bbb17e93db72603ddd96df93821626bc74",
      "signature": "26c778e11ffcb3e66d23b1af0547201d8fc957de125eca3a7edb3a6e02545f62"
    },
    "timestamp": 1585291816342,
    "seed": "7707068aeeb712847e9b804f02a89e3209e28ece806913a097a5220c412d4485",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "chains": {},
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
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
  "took": 139,
  "status": 201,
  "data": {
    "root": "7148df9d5ea41d9f4ea047921a50f28d2192ee8eb38db5fd6b9d0604ea90ef4a",
    "index": 0,
    "timestamp": 1585291816551,
    "count": 6,
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
      "seed": "1d0f5522e5d08b728e785cecaafbaec283a3f78001e6970a1a6ba277b53679f2",
      "hash": "bd24e066707f10779aace889a9351625cfb8707dc2ec9df9fb62cbe6af0f1ad3",
      "chains": {},
      "previous": [],
      "address": "009fb3a5d7445889b48e6b537ff606bbb17e93db72603ddd96df93821626bc74",
      "signature": "26c778e11ffcb3e66d23b1af0547201d8fc957de125eca3a7edb3a6e02545f62"
    },
    "timestamp": 1585291816342,
    "seed": "7707068aeeb712847e9b804f02a89e3209e28ece806913a097a5220c412d4485",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "chains": {},
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "data": {
      "bytes": 7
    },
    "block": {
      "root": "7148df9d5ea41d9f4ea047921a50f28d2192ee8eb38db5fd6b9d0604ea90ef4a",
      "proof": [
        "f8d180a0625d19f2dd63f3c35aeceef1ee71f293dd9d994f783d47183cb3bf10531c85db80a041a57b08fea86fb2ae98d6fc207c3f229cd6325107e54db27f120438dc54701a8080a0d76f938f5c209cfaba02e441d054b71ec234f04679f85f11f8a9eebffc166baca06923bf4f2f897dd7cfa5a17e9955f86a7c06df004d0c5362fee8f304110de88ca08a6ab20b5c86ce43a37d967b808adf0235c7bdf80f9c573f1526d71dc4a74ffa80a05de26ad0b87dae5ea435eb0f2be5431ee0a5cd7733aa2544505ae9977725290e808080808080",
        "f8518080808080a0ada466d63bcb9132ec3ee9dcb70716b45b119185eb03a8c221663fdd12bd800680808080a01f9a912532d5e36ce09b5d00dca626b7c7e2703298f676fe1bbb3be365781cfb808080808080",
        "f842a02031d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a0473156f8476f456befba4e0a78288a582ce2bb431e9764597936fb3443ef3aab"
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
  "took": 16,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "1d0f5522e5d08b728e785cecaafbaec283a3f78001e6970a1a6ba277b53679f2",
      "hash": "bd24e066707f10779aace889a9351625cfb8707dc2ec9df9fb62cbe6af0f1ad3",
      "chains": {},
      "previous": [],
      "address": "009fb3a5d7445889b48e6b537ff606bbb17e93db72603ddd96df93821626bc74",
      "signature": "26c778e11ffcb3e66d23b1af0547201d8fc957de125eca3a7edb3a6e02545f62"
    },
    "timestamp": 1585291816342,
    "seed": "7707068aeeb712847e9b804f02a89e3209e28ece806913a097a5220c412d4485",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "chains": {},
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "block": {
      "root": "7148df9d5ea41d9f4ea047921a50f28d2192ee8eb38db5fd6b9d0604ea90ef4a",
      "proof": [
        "f8d180a0625d19f2dd63f3c35aeceef1ee71f293dd9d994f783d47183cb3bf10531c85db80a041a57b08fea86fb2ae98d6fc207c3f229cd6325107e54db27f120438dc54701a8080a0d76f938f5c209cfaba02e441d054b71ec234f04679f85f11f8a9eebffc166baca06923bf4f2f897dd7cfa5a17e9955f86a7c06df004d0c5362fee8f304110de88ca08a6ab20b5c86ce43a37d967b808adf0235c7bdf80f9c573f1526d71dc4a74ffa80a05de26ad0b87dae5ea435eb0f2be5431ee0a5cd7733aa2544505ae9977725290e808080808080",
        "f8518080808080a0ada466d63bcb9132ec3ee9dcb70716b45b119185eb03a8c221663fdd12bd800680808080a01f9a912532d5e36ce09b5d00dca626b7c7e2703298f676fe1bbb3be365781cfb808080808080",
        "f842a02031d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a0473156f8476f456befba4e0a78288a582ce2bb431e9764597936fb3443ef3aab"
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
  "took": 4,
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
  "took": 28,
  "status": 201,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "166d4fbf330e060dd5f8e85d1f72ea66286ae6707e64075f4b8b53e430ae96dc",
      "hash": "1a409754f227ed62d2c4ca86dfc8c5f2e1e1eceba699f1627e25066c725ccc46",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ],
      "address": "0171b51198c06612ebc898997c058471d810034c65eb98b796a0a275c56b9fa3",
      "signature": "6a6f9b0200ad3fd36e4718f9db665dd21a0477b5476219a6af484ceee4815a35"
    },
    "timestamp": 1585291816694,
    "seed": "4a32841be2df2b5a075ed6a82ef01e5d330085af2034dc559eef8a44323675db",
    "hash": "5b193ff1cf8ac2f1aabe5fe7de85debb29e8f337bc89b135a590c1073800cf80",
    "chains": {},
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xa6bbc4cc1e50088492dc482801c4d4695d14f367b3b10e34f93a962e1a8213b634b7bfa6a95edc6bbc25a359cf9a4554d6dee72078a671f401b6aa667dcb1ab31c",
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
  "took": 20,
  "status": 201,
  "data": {
    "provable": {
      "id": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951",
      "seed": "f8fe7d9df4758143aebbb832661088bacd77f245fde9ce450146c2ec70b6b93e",
      "hash": "dfab675542dba41275150550ade7d6176ce0b1f7fc0cdba1f416e8fe1d8d85f1",
      "chains": {
        "78369d5c52c70c4953ca877f1c2ec510db53794ed2bb074d071e4fa78e1a7b26": null
      },
      "previous": [],
      "address": "c78b71520f42d2e0dff7ca882dfe0c88ef9f80d514fc965c1620566da85e35a0",
      "signature": "fc6b77b5568776accf8c43271284e712971b969ee532ac17e0fc95e36ee22cf8"
    },
    "timestamp": 1585291816738,
    "seed": "96876b4315063f60136c1d0d900722381e8faa6e1d4c667e3ac53b6a7e7ea8b5",
    "hash": "ed914881e913845413125b682876d976b9eab7335980726ddc59f785beb4d5ad",
    "chains": {
      "chain1": null
    },
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xa1d9b27cb9cbcdda4172a373ef4e82f13f193d837e2e21b760685d099354ef7a7e3250470af7e33ffe6b77aa27b0d509b00e311917249a022abf4cc8469506751b"
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
  "took": 22,
  "status": 201,
  "data": {
    "provable": {
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "seed": "f08e1865261e38439c8ffa01d4d9cbc7c2f0efa42a1049761b6b5e1c8351ff43",
      "hash": "37be12fc5956dca6f8d8fa9115ad0560d447054a2fd8e0eefb914fdbfeb1be94",
      "chains": {
        "849dcfbfa8b81a81c7317b9cb15f3d25ed26d6d3d70ceca587797e77b7b901ea": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ],
      "address": "1891685b2841a6e7e15e388727e7d272d3f356b12ce613f49be1c7de0943aec9",
      "signature": "943e9f83d5f261f8019fdaeefde479eba54e6670e74c7cbc18ec2e0a04805e4a"
    },
    "timestamp": 1585291816776,
    "seed": "991c8a94fd7ab8d54d2363827508bd2cedfe2cefa2b76c4b3a0722a3b142d5e5",
    "hash": "1bb1c73103ef6ae888ab45afa617f8ec63f21bf959a284363d7a83055ac4f87d",
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    },
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x13f6c3fbc6513cd9dbeca59878613ea10f2356bf5fcc75d15b8993ceb5cb56156b11668c316505ba817f8ab2a0edb24b555de3442865ee336f0b9f3cad8634ae1b",
    "data": {
      "bytes": 7
    }
  }
}
```

The field `chains` contains the key `chain1` whose value is the record identifier of the previously inserted record. The record has been appended at the end of the chain and the label `chain1` now refers to the newly inserted record. This information is provable because it is part of the record definition. The key stored in `provable.chains` has been obfuscated to avoid any data leak. `chains.chain1` can be removed by deleting the entire chain.

We can check that:
- the obfuscated fingerprint of `chain1` is equal to `849dcfbfa8b81a81c7317b9cb15f3d25ed26d6d3d70ceca587797e77b7b901ea`:
```bash
echo -n "991c8a94fd7ab8d54d2363827508bd2cedfe2cefa2b76c4b3a0722a3b142d5e5 chain1" | sha256sum
```
- the `chains.chain1` value is equal to the `provable.chains.849dcfbfa8b81a81c7317b9cb15f3d25ed26d6d3d70ceca587797e77b7b901ea` value: `893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951`.

---

To retrieve the record currently refered by a chain name (i.e. the last record of the chain), you can use the following API call:

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 9,
  "status": 200,
  "data": {
    "provable": {
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "seed": "f08e1865261e38439c8ffa01d4d9cbc7c2f0efa42a1049761b6b5e1c8351ff43",
      "hash": "37be12fc5956dca6f8d8fa9115ad0560d447054a2fd8e0eefb914fdbfeb1be94",
      "chains": {
        "849dcfbfa8b81a81c7317b9cb15f3d25ed26d6d3d70ceca587797e77b7b901ea": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ],
      "address": "1891685b2841a6e7e15e388727e7d272d3f356b12ce613f49be1c7de0943aec9",
      "signature": "943e9f83d5f261f8019fdaeefde479eba54e6670e74c7cbc18ec2e0a04805e4a"
    },
    "timestamp": 1585291816776,
    "seed": "991c8a94fd7ab8d54d2363827508bd2cedfe2cefa2b76c4b3a0722a3b142d5e5",
    "hash": "1bb1c73103ef6ae888ab45afa617f8ec63f21bf959a284363d7a83055ac4f87d",
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    },
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x13f6c3fbc6513cd9dbeca59878613ea10f2356bf5fcc75d15b8993ceb5cb56156b11668c316505ba817f8ab2a0edb24b555de3442865ee336f0b9f3cad8634ae1b",
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
  "took": 38,
  "status": 201,
  "data": {
    "provable": {
      "id": "8a95759db45a3239df8cb910fa67c2fc90ec948ba00bfe3017e51b22f6a5c814",
      "seed": "37d3c0f48f3f6c183525191927db2bd3355687df77891de13c9e7be449d35f76",
      "hash": "aacafc4cf2a4d7c98559b789e941eeb693fac27e47df908fc5ac5523e398ab5e",
      "chains": {
        "0441945d51f2839721d19931c0d3c929a593435a353fa2f922c087b1be532418": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "7329bda1dc397a2e850c8e656c9b12b2679a312a452ac72e5ef89431001861d1": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ],
      "address": "cdc87f86df3626e2cac16cc5c682eac299f4fb48b7fe3b63df9cce59760eb53e",
      "signature": "5be47513cc7e96f809b56d8a2713eb75ec22993436cdfbd8bffe87f12ee7347a"
    },
    "timestamp": 1585291816945,
    "seed": "439b675c1c11571693d25d85001548695187aaf603fb8641e8f7337f4c92dd66",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
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
  "took": 11,
  "status": 200,
  "data": {
    "provable": {
      "id": "8a95759db45a3239df8cb910fa67c2fc90ec948ba00bfe3017e51b22f6a5c814",
      "seed": "37d3c0f48f3f6c183525191927db2bd3355687df77891de13c9e7be449d35f76",
      "hash": "aacafc4cf2a4d7c98559b789e941eeb693fac27e47df908fc5ac5523e398ab5e",
      "chains": {
        "0441945d51f2839721d19931c0d3c929a593435a353fa2f922c087b1be532418": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "7329bda1dc397a2e850c8e656c9b12b2679a312a452ac72e5ef89431001861d1": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ],
      "address": "cdc87f86df3626e2cac16cc5c682eac299f4fb48b7fe3b63df9cce59760eb53e",
      "signature": "5be47513cc7e96f809b56d8a2713eb75ec22993436cdfbd8bffe87f12ee7347a"
    },
    "timestamp": 1585291816945,
    "seed": "439b675c1c11571693d25d85001548695187aaf603fb8641e8f7337f4c92dd66",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
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
  "took": 9,
  "status": 200,
  "data": {
    "provable": {
      "id": "8a95759db45a3239df8cb910fa67c2fc90ec948ba00bfe3017e51b22f6a5c814",
      "seed": "37d3c0f48f3f6c183525191927db2bd3355687df77891de13c9e7be449d35f76",
      "hash": "aacafc4cf2a4d7c98559b789e941eeb693fac27e47df908fc5ac5523e398ab5e",
      "chains": {
        "0441945d51f2839721d19931c0d3c929a593435a353fa2f922c087b1be532418": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "7329bda1dc397a2e850c8e656c9b12b2679a312a452ac72e5ef89431001861d1": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ],
      "address": "cdc87f86df3626e2cac16cc5c682eac299f4fb48b7fe3b63df9cce59760eb53e",
      "signature": "5be47513cc7e96f809b56d8a2713eb75ec22993436cdfbd8bffe87f12ee7347a"
    },
    "timestamp": 1585291816945,
    "seed": "439b675c1c11571693d25d85001548695187aaf603fb8641e8f7337f4c92dd66",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
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
  "took": 7,
  "status": 200,
  "data": {
    "id": "8a95759db45a3239df8cb910fa67c2fc90ec948ba00bfe3017e51b22f6a5c814"
  }
}
```

The response gives you the last record id.

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 4,
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
  "took": 14,
  "status": 200,
  "data": {
    "provable": {
      "id": "8a95759db45a3239df8cb910fa67c2fc90ec948ba00bfe3017e51b22f6a5c814",
      "seed": "37d3c0f48f3f6c183525191927db2bd3355687df77891de13c9e7be449d35f76",
      "hash": "aacafc4cf2a4d7c98559b789e941eeb693fac27e47df908fc5ac5523e398ab5e",
      "chains": {
        "0441945d51f2839721d19931c0d3c929a593435a353fa2f922c087b1be532418": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "7329bda1dc397a2e850c8e656c9b12b2679a312a452ac72e5ef89431001861d1": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ],
      "address": "cdc87f86df3626e2cac16cc5c682eac299f4fb48b7fe3b63df9cce59760eb53e",
      "signature": "5be47513cc7e96f809b56d8a2713eb75ec22993436cdfbd8bffe87f12ee7347a"
    },
    "timestamp": 1585291816945,
    "seed": "439b675c1c11571693d25d85001548695187aaf603fb8641e8f7337f4c92dd66",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
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
  "took": 10,
  "status": 200,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "166d4fbf330e060dd5f8e85d1f72ea66286ae6707e64075f4b8b53e430ae96dc",
      "hash": "1a409754f227ed62d2c4ca86dfc8c5f2e1e1eceba699f1627e25066c725ccc46",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ],
      "address": "0171b51198c06612ebc898997c058471d810034c65eb98b796a0a275c56b9fa3",
      "signature": "6a6f9b0200ad3fd36e4718f9db665dd21a0477b5476219a6af484ceee4815a35"
    },
    "timestamp": 1585291816694,
    "seed": "4a32841be2df2b5a075ed6a82ef01e5d330085af2034dc559eef8a44323675db",
    "hash": "5b193ff1cf8ac2f1aabe5fe7de85debb29e8f337bc89b135a590c1073800cf80",
    "chains": {},
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xa6bbc4cc1e50088492dc482801c4d4695d14f367b3b10e34f93a962e1a8213b634b7bfa6a95edc6bbc25a359cf9a4554d6dee72078a671f401b6aa667dcb1ab31c",
    "data": {
      "bytes": 7
    }
  }
}
```

`chain1` has been deleted as a chain label but the record that was referred to by this chain label is still available and can be accessed using the `chain2` label.

### Block API calls

You can create a block containing a maximum of 1 record by running:

```bash
curl -XPOST "$api/blocks?pretty=true&max=1"
```

```json
{
  "took": 67,
  "status": 201,
  "data": {
    "root": "0248d37c2dcfabcc13afc7bf7d793dbdf50c432c9a0523312dcb1c6ade874dd0",
    "index": 1,
    "timestamp": 1585291817210,
    "count": 1,
    "previous": {
      "root": "7148df9d5ea41d9f4ea047921a50f28d2192ee8eb38db5fd6b9d0604ea90ef4a",
      "proof": [
        "e217a0e31788022d3f945ffc3bcd12e690dc643c2653de426ae6fd68f2555e7af6e009",
        "f871a08c8ff0785a866b98af51b504e15a0c11f6fa22c8dcef38ad31ba31bc8faf459c8080a079dbed1d8cb086c58fd34d74a414e81bf9fb0b07cbf26930d894f39c02865ec980a04aacdaffad8b37d838ae54c0aba514d073a5c33c9eb60e43877a9a2ca21ac94c8080808080808080808080",
        "ea8820726576696f7573a07148df9d5ea41d9f4ea047921a50f28d2192ee8eb38db5fd6b9d0604ea90ef4a"
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

```bash
curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 85,
  "status": 201,
  "data": {
    "root": "8e7060c03e584872d39f9d141c539c44c0e0091d86bbed67da821095c3520599",
    "index": 2,
    "timestamp": 1585291817310,
    "count": 3,
    "previous": {
      "root": "0248d37c2dcfabcc13afc7bf7d793dbdf50c432c9a0523312dcb1c6ade874dd0",
      "proof": [
        "f87180808080a0cb850285f2b7a92f977d75a47c8403d5ae6f7251cc35cbef48a892e5bf6899da8080a06a699f9d3d41f75f1692e7e92e7792f7eea3593025b49c7416c1820268290a16a0554e226b0bb765d099cca8708da8fb4a8fb0bc7ce925f92dede7bf3690abe3198080808080808080",
        "f851a0e605ebb7e8f85b8ce19205fb67a323e4704b1b2dd1ab152dc32b02e00fe2164b8080a0d0e36893082b59cae35b3a5f220b6a8d7fab0688556ce3cca47adffbbc90068280808080808080808080808080",
        "ea8820726576696f7573a00248d37c2dcfabcc13afc7bf7d793dbdf50c432c9a0523312dcb1c6ade874dd0"
      ]
    }
  }
}
```

You can run a block creation again to see that by default no block is created if there is no pending record.

```bash
curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 18,
  "status": 200,
  "data": null
}
```

If you want to allow the creation of an empty block, you can use the `empty` option.

To be sure to create an empty block, you must use both `empty=true` and `max=0`.

```bash
curl -XPOST "$api/blocks?pretty=true&empty=true"
```

```json
{
  "took": 55,
  "status": 201,
  "data": {
    "root": "d5f6cc314d54f305d5af14da5976d49b61e020c5c2e4f813bcfa87502e2cd842",
    "index": 3,
    "timestamp": 1585291817411,
    "count": 0,
    "previous": {
      "root": "8e7060c03e584872d39f9d141c539c44c0e0091d86bbed67da821095c3520599",
      "proof": [
        "e217a07e6a922ede66f0766034729d48b481d5b190403b170b7310a14ef2bc8e4d9f53",
        "f851a0b38d8bde18b43098bf2e29b8df144a152a59342c9184656b3a01376916678f428080a0bfe093e67156559de9be5c97b7359fc68b65ba3cf23ea2d12f1ac398795f75e480808080808080808080808080",
        "ea8820726576696f7573a08e7060c03e584872d39f9d141c539c44c0e0091d86bbed67da821095c3520599"
      ]
    }
  }
}
```

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
      "root": "d5f6cc314d54f305d5af14da5976d49b61e020c5c2e4f813bcfa87502e2cd842",
      "index": 3,
      "timestamp": 1585291817411,
      "count": 0,
      "previous": {
        "root": "8e7060c03e584872d39f9d141c539c44c0e0091d86bbed67da821095c3520599",
        "proof": [
          "e217a07e6a922ede66f0766034729d48b481d5b190403b170b7310a14ef2bc8e4d9f53",
          "f851a0b38d8bde18b43098bf2e29b8df144a152a59342c9184656b3a01376916678f428080a0bfe093e67156559de9be5c97b7359fc68b65ba3cf23ea2d12f1ac398795f75e480808080808080808080808080",
          "ea8820726576696f7573a08e7060c03e584872d39f9d141c539c44c0e0091d86bbed67da821095c3520599"
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
  "took": 6,
  "status": 200,
  "data": {
    "root": "0248d37c2dcfabcc13afc7bf7d793dbdf50c432c9a0523312dcb1c6ade874dd0",
    "index": 1,
    "timestamp": 1585291817210,
    "count": 1,
    "previous": {
      "root": "7148df9d5ea41d9f4ea047921a50f28d2192ee8eb38db5fd6b9d0604ea90ef4a",
      "proof": [
        "e217a0e31788022d3f945ffc3bcd12e690dc643c2653de426ae6fd68f2555e7af6e009",
        "f871a08c8ff0785a866b98af51b504e15a0c11f6fa22c8dcef38ad31ba31bc8faf459c8080a079dbed1d8cb086c58fd34d74a414e81bf9fb0b07cbf26930d894f39c02865ec980a04aacdaffad8b37d838ae54c0aba514d073a5c33c9eb60e43877a9a2ca21ac94c8080808080808080808080",
        "ea8820726576696f7573a07148df9d5ea41d9f4ea047921a50f28d2192ee8eb38db5fd6b9d0604ea90ef4a"
      ]
    }
  }
}
```

You can also retrieve it using its hash.

```bash
curl -XGET "$api/blocks/0248d37c2dcfabcc13afc7bf7d793dbdf50c432c9a0523312dcb1c6ade874dd0?pretty=true"
```

```json
{
  "took": 8,
  "status": 200,
  "data": {
    "root": "0248d37c2dcfabcc13afc7bf7d793dbdf50c432c9a0523312dcb1c6ade874dd0",
    "index": 1,
    "timestamp": 1585291817210,
    "count": 1,
    "previous": {
      "root": "7148df9d5ea41d9f4ea047921a50f28d2192ee8eb38db5fd6b9d0604ea90ef4a",
      "proof": [
        "e217a0e31788022d3f945ffc3bcd12e690dc643c2653de426ae6fd68f2555e7af6e009",
        "f871a08c8ff0785a866b98af51b504e15a0c11f6fa22c8dcef38ad31ba31bc8faf459c8080a079dbed1d8cb086c58fd34d74a414e81bf9fb0b07cbf26930d894f39c02865ec980a04aacdaffad8b37d838ae54c0aba514d073a5c33c9eb60e43877a9a2ca21ac94c8080808080808080808080",
        "ea8820726576696f7573a07148df9d5ea41d9f4ea047921a50f28d2192ee8eb38db5fd6b9d0604ea90ef4a"
      ]
    }
  }
}
```

## Tips

```bash
# create a record from a file
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
