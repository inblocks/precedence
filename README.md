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
  "took": 23,
  "status": 201,
  "data": {
    "provable": {
      "id": "8d15639e5791c97961cefa1ad97bf68992418daf76c8315647f76a39bb36fc91",
      "seed": "ca86377e07badda2731743bc304d0de2976bdaaa42fbadf95ab58cc61bc4b088",
      "hash": "e3416999c37177a8e5dbaa5c108524dca0c1216e670cf25c89aca0f1653ae7dd",
      "address": "80f4a15801860b6e32865f94242a3f53187c7087def0f5bb6918de0658a493b9",
      "signature": "e82e2312cfabc2fdaa0470a1e4254ef3d650893f64caa14c0f63dc87b5129538",
      "chains": {},
      "previous": []
    },
    "timestamp": 1584686208063,
    "seed": "3969a2a48d1f029361af6f8ef9dc9aa3f9716f803ccf0ef032159b1b84e93fb1",
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
echo -n '3969a2a48d1f029361af6f8ef9dc9aa3f9716f803ccf0ef032159b1b84e93fb1 3969a2a48d1f029361af6f8ef9dc9aa3f9716f803ccf0ef032159b1b84e93fb1' | sha256sum
```
- the obfuscated fingerprint of the hash is equal to `provable.hash` value:
```bash
echo -n "3969a2a48d1f029361af6f8ef9dc9aa3f9716f803ccf0ef032159b1b84e93fb1 $(echo -n 'value 1' | sha256sum | cut -d' ' -f1)" | sha256sum
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
  "took": 24,
  "status": 201,
  "data": {
    "provable": {
      "id": "01ceed0ad446d2340a9ead49c1585928a17984b2a2022ee3e50dd0cc842ebbb4",
      "seed": "e46c9e088340b94b9fec7ddbee100439d13b28a18d6f3c7f007b74df51b021b2",
      "hash": "39cb2b887bb2926d94866a6391345903df56d98b07fcaa30a8be78c14fd54841",
      "address": "cba0dff61d5bcfe6a143521a5beb1d5078fad4f7fbaa706cbc62231a3d09e3f3",
      "signature": "e45ebbdebbd8d7a3967bcba94439ab480be4fd979f67e8885765d74888ecdfc6",
      "chains": {},
      "previous": []
    },
    "timestamp": 1584686208192,
    "seed": "211e2266760d2001a74362e879779d133fda69c6b7005e4f89b696cbe99a08c0",
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
curl -XGET "$api/records/01ceed0ad446d2340a9ead49c1585928a17984b2a2022ee3e50dd0cc842ebbb4?data=true"
```

---

Let's create the same original data again.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```
```json
{
  "took": 21,
  "status": 201,
  "data": {
    "provable": {
      "id": "2d6e0033239a63e69776dd55b662cf0ed2255a897f0943e2249aa0ba2b0cd586",
      "seed": "8d148153cb5af284cd51c740d47620e710d74935a2b9fcea9c206b43d9af5bd5",
      "hash": "72def08c890b3e39453768cca386a070a96a30aa7140b3e2cd13bd871b5d8948",
      "address": "4e7b893cc0f3f50aed7bb13d3c4ad411ec4e181c597bc170a661656234895e71",
      "signature": "7444d5deba50fa6b9778dde85b461c5f181d241240d7c724708be38a502ad12e",
      "chains": {},
      "previous": []
    },
    "timestamp": 1584686208312,
    "seed": "b76a6f5057b851220da806158286c4f3b1277d477272ce2d31e735918dd9dd37",
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

It is possible to provide the fingerprint of the original data with the `hash` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&hash=5e2d78eb5107622b5441f53ac317fe431cebbfc2a04036c4ed820e11d54d6d1c" -d "value 3"
```

```json
{
  "took": 21,
  "status": 201,
  "data": {
    "provable": {
      "id": "a0779a3b573e4104fdc58cd2ae7de9d31aa000f7ce9e30c4a2ef47e5bda90133",
      "seed": "ee687f79f76c73cc061cc6f6e845d5df9daa44112e21bbcb0ea6947d7bf9f193",
      "hash": "f98daead531df330e2805b3942785e3dbb3bd974d9aeae6198ca9f7e349abc5f",
      "address": "ec2e7432e843bd9ff13d6a0cf477ec5cbbc191c003c050e2562484070def24a4",
      "signature": "38aadd24642e3414b704523006da261a4d9919500a3906bffb03d4fc9b1d33f4",
      "chains": {},
      "previous": []
    },
    "timestamp": 1584686208349,
    "seed": "d42285af2299ea96e5693f06e94e5e28b3e52cab552abe152850ad54b4a9d7c2",
    "hash": "5e2d78eb5107622b5441f53ac317fe431cebbfc2a04036c4ed820e11d54d6d1c",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x33d5ba51b98e9956d813a52fe53ea726cf77877d38180f8a1754e077771b9a71465f4dd657d5a165a491cefa5663b2339e5dd82540e17c8df965d7350781d8361c",
    "chains": {}
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
  "took": 17,
  "status": 201,
  "data": {
    "provable": {
      "id": "5bb63c12b508ea9ed3ff3dc708c40163db20f4e826a6659b85ccbe89f7674f9d",
      "seed": "dde18bc1facdadc47ad605e6f1110c71d17685cccdde2b744c714bd7ac2ae1df",
      "hash": "28b3ecb3691115255c70ec38bd664abbc8c88b1887ad77bb8455d42de39d4374",
      "address": "44d760410055cd8c86a7291929acbb1f7ae2f33c501bec0f3c8b008d44a2c830",
      "signature": "a2cafa2eff923eb40a95c24b01ca0550e90b4360fcaf37d110746e58e2bc4ef5",
      "chains": {},
      "previous": []
    },
    "timestamp": 1584686208385,
    "seed": "3a92cd0269b285aa50b517d6fa748b13b9e6fbf2adb90b6532f91fefd9b431ca",
    "hash": "085a57ddb929d1a2853aad31940d6e718918762b8db43f299e86fe732d13d6b9",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x0335865798e357d8dbe4a851f387e2f091be6eca16d3909711a0450eb030323a12cf602f31b1635add36f2bd67a4bd5a49e175ac86c828b811a06c30c49b3fc21c",
    "chains": {}
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
  "took": 21,
  "status": 201,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "326a4fff11060022629990a600243bbd82990f54d2ede7f481920f5de1d486e8",
      "hash": "218c04e35c8cf5a39b216c5fd7172935239ef7f7ef597c00207d1f30c293751b",
      "address": "028d30fb780a160be10c03f5fe70224cfbb26d5fb4cf154216d354ec4fed0017",
      "signature": "b48704f8e2f6f3344b25b19ab1b14cf8e82ce7385ef3003931067217d6520403",
      "chains": {},
      "previous": []
    },
    "timestamp": 1584686208418,
    "seed": "b84ef2cab05138ce1ad90e41dc82b1e769b2053844338aba1d4184bbb6f29126",
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
  "took": 14,
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
      "seed": "326a4fff11060022629990a600243bbd82990f54d2ede7f481920f5de1d486e8",
      "hash": "218c04e35c8cf5a39b216c5fd7172935239ef7f7ef597c00207d1f30c293751b",
      "address": "028d30fb780a160be10c03f5fe70224cfbb26d5fb4cf154216d354ec4fed0017",
      "signature": "b48704f8e2f6f3344b25b19ab1b14cf8e82ce7385ef3003931067217d6520403",
      "chains": {},
      "previous": []
    },
    "timestamp": 1584686208418,
    "seed": "b84ef2cab05138ce1ad90e41dc82b1e769b2053844338aba1d4184bbb6f29126",
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
  "took": 128,
  "status": 201,
  "data": {
    "root": "41f29e92ac6748fc27c37d8965bc2d3557538247bd440243329bdde49fed0546",
    "index": 0,
    "timestamp": 1584686208621,
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
  "took": 14,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "326a4fff11060022629990a600243bbd82990f54d2ede7f481920f5de1d486e8",
      "hash": "218c04e35c8cf5a39b216c5fd7172935239ef7f7ef597c00207d1f30c293751b",
      "address": "028d30fb780a160be10c03f5fe70224cfbb26d5fb4cf154216d354ec4fed0017",
      "signature": "b48704f8e2f6f3344b25b19ab1b14cf8e82ce7385ef3003931067217d6520403",
      "chains": {},
      "previous": []
    },
    "timestamp": 1584686208418,
    "seed": "b84ef2cab05138ce1ad90e41dc82b1e769b2053844338aba1d4184bbb6f29126",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "chains": {},
    "data": {
      "bytes": 7
    },
    "block": {
      "root": "41f29e92ac6748fc27c37d8965bc2d3557538247bd440243329bdde49fed0546",
      "proof": [
        "f8f1a0f79d277eb14f7e1df6791dbdfac72f2b1c1215e873835bfd9830f233f1b53ca880a0b2508f5d458a69651f693d81552deaeac5cd4021ae923b4a696a7cddec077edea025cbdf3919ff84196ced2e9f376c5b4bc7c8629dc1173918c8e506051b5321c480a017ac07b26e96156df9bd8e0755153a731fb6ed8270ab6ed601c72af750559cb680a032de47c880fee3f196b02f3e5e4a57d83477ba074273c6198f547d2fb307d4dca04c6d801ca008ddb218749a5c6b3c8c7917ea40ccbf1c117f1f52d46104dd1f5f80a0da9cf54e3714ee71456fb6f16e15b2396b5940bea96add8a92116eb2038f0b32808080808080",
        "f842a03a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a070e14337bc289cbb38463d82516f53ffcbb467aa004566c695699e1fbbc72946"
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
  "took": 9,
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
  "took": 14,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "326a4fff11060022629990a600243bbd82990f54d2ede7f481920f5de1d486e8",
      "hash": "218c04e35c8cf5a39b216c5fd7172935239ef7f7ef597c00207d1f30c293751b",
      "address": "028d30fb780a160be10c03f5fe70224cfbb26d5fb4cf154216d354ec4fed0017",
      "signature": "b48704f8e2f6f3344b25b19ab1b14cf8e82ce7385ef3003931067217d6520403",
      "chains": {},
      "previous": []
    },
    "timestamp": 1584686208418,
    "seed": "b84ef2cab05138ce1ad90e41dc82b1e769b2053844338aba1d4184bbb6f29126",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "chains": {},
    "block": {
      "root": "41f29e92ac6748fc27c37d8965bc2d3557538247bd440243329bdde49fed0546",
      "proof": [
        "f8f1a0f79d277eb14f7e1df6791dbdfac72f2b1c1215e873835bfd9830f233f1b53ca880a0b2508f5d458a69651f693d81552deaeac5cd4021ae923b4a696a7cddec077edea025cbdf3919ff84196ced2e9f376c5b4bc7c8629dc1173918c8e506051b5321c480a017ac07b26e96156df9bd8e0755153a731fb6ed8270ab6ed601c72af750559cb680a032de47c880fee3f196b02f3e5e4a57d83477ba074273c6198f547d2fb307d4dca04c6d801ca008ddb218749a5c6b3c8c7917ea40ccbf1c117f1f52d46104dd1f5f80a0da9cf54e3714ee71456fb6f16e15b2396b5940bea96add8a92116eb2038f0b32808080808080",
        "f842a03a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a070e14337bc289cbb38463d82516f53ffcbb467aa004566c695699e1fbbc72946"
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
  "took": 23,
  "status": 201,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "31c5b970fc3cb2f4e5dc118f19b47197392f9ca9c0872eea5fbfa575fbf4edff",
      "hash": "3f5cf9ff61934a196ce9def0e5b5b37c65be9cbc6e882a753f4ee69b28bc5343",
      "address": "e306c26ec14aa816b03fa0720b946a22a26cfdadd23fb3dfa3467c1474eb265b",
      "signature": "d24388882770f6dfbdcff593ae2496d14ee3006bf9da027fe50ffa9e64cc0b4c",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "timestamp": 1584686208758,
    "seed": "0eeefa84d3e85e87b58e0fa055ebf18cfded347f34ac59f49534fcb01d200b5c",
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
  "took": 22,
  "status": 201,
  "data": {
    "provable": {
      "id": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951",
      "seed": "26b2fa009de7396b6eeb743197084bec067ed5f7e17a46b565bb01244fefb59c",
      "hash": "83e462076b802e6772df162195669aa14638560b6dff3fbd66cfc4146569a946",
      "address": "4c6a9e264181f03ff71e75aa888666c04d595dab8054313ce26b74f9f9600d67",
      "signature": "c9050ebfbc269bef8d8523860ac4d993600d3e6bf5b44db12142ee0a25587505",
      "chains": {
        "e7ab5c641fb9ab9f3899d909b8de3ae2b31b530952525f51cdb968d0a58a00a1": null
      },
      "previous": []
    },
    "timestamp": 1584686208800,
    "seed": "498ca91c7ccc1cc54d7c9204cc1707ff80ba55cb2517367210393464538f5a3f",
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
  "took": 27,
  "status": 201,
  "data": {
    "provable": {
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "seed": "b1a747020bedf74925a576414d74702dbfd2625a4d7d26a58a1b7680729ec65b",
      "hash": "f73487c9c25d21f6c09a4e7572419bdd908fca1579d2356a1ca3ba6161382e09",
      "address": "6ba0d5aa1e936448ad47f22da8f682bd2fa7f33efedf060f16f6c67fc926dd1b",
      "signature": "5fedff87657a852bae9cc4c39e6f4d4634b660cf8f7e91774dbfd6936a86fd0a",
      "chains": {
        "35fada4c5f64f5060ebd23187a2830604e2c8cdfc40dee1a0cfe4724375bbaa0": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1584686208845,
    "seed": "dcef1819dcb71cbaec0a123b5ed6b2c0a5d1c39108d3846b81ee39de23167096",
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
- the obfuscated fingerprint of `chain1` is equal to `35fada4c5f64f5060ebd23187a2830604e2c8cdfc40dee1a0cfe4724375bbaa0`:
```bash
echo -n "dcef1819dcb71cbaec0a123b5ed6b2c0a5d1c39108d3846b81ee39de23167096 chain1" | sha256sum
```
- the `chains.chain1` value is equal to the `provable.chains.35fada4c5f64f5060ebd23187a2830604e2c8cdfc40dee1a0cfe4724375bbaa0` value: `893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951`.

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
      "seed": "b1a747020bedf74925a576414d74702dbfd2625a4d7d26a58a1b7680729ec65b",
      "hash": "f73487c9c25d21f6c09a4e7572419bdd908fca1579d2356a1ca3ba6161382e09",
      "address": "6ba0d5aa1e936448ad47f22da8f682bd2fa7f33efedf060f16f6c67fc926dd1b",
      "signature": "5fedff87657a852bae9cc4c39e6f4d4634b660cf8f7e91774dbfd6936a86fd0a",
      "chains": {
        "35fada4c5f64f5060ebd23187a2830604e2c8cdfc40dee1a0cfe4724375bbaa0": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1584686208845,
    "seed": "dcef1819dcb71cbaec0a123b5ed6b2c0a5d1c39108d3846b81ee39de23167096",
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
  "took": 21,
  "status": 201,
  "data": {
    "provable": {
      "id": "be8bbc74792fe6be23d3e84d566f42098c1ee3926b1f06d6ee541ea4c87eda86",
      "seed": "3c5a980db600cd38cb062bb761b779f6e712cb6dd0e52cc5541bd0e197c7e09e",
      "hash": "58c111f3501040e121890bacc1aa25c1046d39c03645b06824d6e8b800ea55f6",
      "address": "96c652dfb05b2dc5c356a173b6a0d0bb50185afba8e0f8751e666cba6d39082a",
      "signature": "c114b71398bfb7ab4b524a7da7c88e58e4834bb5f1111b0f7fb77bd0033d268a",
      "chains": {
        "0052597c7ef7174cc8ee8b831e83f95497987905c73f0adff247728a24d60ab6": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "dfb55e31d3ed7fa999cafe9ed49c8832bbdac545b7160510cd5b93437baaea60": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1584686208999,
    "seed": "c916caf239b5e6e9220374adeccde0ed8295b20457ba4546718ba4ac8a7eef79",
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
  "took": 15,
  "status": 200,
  "data": {
    "provable": {
      "id": "be8bbc74792fe6be23d3e84d566f42098c1ee3926b1f06d6ee541ea4c87eda86",
      "seed": "3c5a980db600cd38cb062bb761b779f6e712cb6dd0e52cc5541bd0e197c7e09e",
      "hash": "58c111f3501040e121890bacc1aa25c1046d39c03645b06824d6e8b800ea55f6",
      "address": "96c652dfb05b2dc5c356a173b6a0d0bb50185afba8e0f8751e666cba6d39082a",
      "signature": "c114b71398bfb7ab4b524a7da7c88e58e4834bb5f1111b0f7fb77bd0033d268a",
      "chains": {
        "0052597c7ef7174cc8ee8b831e83f95497987905c73f0adff247728a24d60ab6": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "dfb55e31d3ed7fa999cafe9ed49c8832bbdac545b7160510cd5b93437baaea60": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1584686208999,
    "seed": "c916caf239b5e6e9220374adeccde0ed8295b20457ba4546718ba4ac8a7eef79",
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
  "took": 9,
  "status": 200,
  "data": {
    "provable": {
      "id": "be8bbc74792fe6be23d3e84d566f42098c1ee3926b1f06d6ee541ea4c87eda86",
      "seed": "3c5a980db600cd38cb062bb761b779f6e712cb6dd0e52cc5541bd0e197c7e09e",
      "hash": "58c111f3501040e121890bacc1aa25c1046d39c03645b06824d6e8b800ea55f6",
      "address": "96c652dfb05b2dc5c356a173b6a0d0bb50185afba8e0f8751e666cba6d39082a",
      "signature": "c114b71398bfb7ab4b524a7da7c88e58e4834bb5f1111b0f7fb77bd0033d268a",
      "chains": {
        "0052597c7ef7174cc8ee8b831e83f95497987905c73f0adff247728a24d60ab6": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "dfb55e31d3ed7fa999cafe9ed49c8832bbdac545b7160510cd5b93437baaea60": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1584686208999,
    "seed": "c916caf239b5e6e9220374adeccde0ed8295b20457ba4546718ba4ac8a7eef79",
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
  "took": 6,
  "status": 200,
  "data": {
    "id": "be8bbc74792fe6be23d3e84d566f42098c1ee3926b1f06d6ee541ea4c87eda86"
  }
}
```

The response gives you the last record id.

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 5,
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
      "id": "be8bbc74792fe6be23d3e84d566f42098c1ee3926b1f06d6ee541ea4c87eda86",
      "seed": "3c5a980db600cd38cb062bb761b779f6e712cb6dd0e52cc5541bd0e197c7e09e",
      "hash": "58c111f3501040e121890bacc1aa25c1046d39c03645b06824d6e8b800ea55f6",
      "address": "96c652dfb05b2dc5c356a173b6a0d0bb50185afba8e0f8751e666cba6d39082a",
      "signature": "c114b71398bfb7ab4b524a7da7c88e58e4834bb5f1111b0f7fb77bd0033d268a",
      "chains": {
        "0052597c7ef7174cc8ee8b831e83f95497987905c73f0adff247728a24d60ab6": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "dfb55e31d3ed7fa999cafe9ed49c8832bbdac545b7160510cd5b93437baaea60": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1584686208999,
    "seed": "c916caf239b5e6e9220374adeccde0ed8295b20457ba4546718ba4ac8a7eef79",
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
      "seed": "31c5b970fc3cb2f4e5dc118f19b47197392f9ca9c0872eea5fbfa575fbf4edff",
      "hash": "3f5cf9ff61934a196ce9def0e5b5b37c65be9cbc6e882a753f4ee69b28bc5343",
      "address": "e306c26ec14aa816b03fa0720b946a22a26cfdadd23fb3dfa3467c1474eb265b",
      "signature": "d24388882770f6dfbdcff593ae2496d14ee3006bf9da027fe50ffa9e64cc0b4c",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "timestamp": 1584686208758,
    "seed": "0eeefa84d3e85e87b58e0fa055ebf18cfded347f34ac59f49534fcb01d200b5c",
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

You can create a block containing a maximum of 1 record by running:

```bash
curl -XPOST "$api/blocks?pretty=true&max=1"
```

```json
{
  "took": 73,
  "status": 201,
  "data": {
    "root": "47fd99e843e8b99c8816914982a155290f872b0e75bb1fa52af49194271c589e",
    "index": 1,
    "timestamp": 1584686209227,
    "count": 1,
    "previous": {
      "root": "41f29e92ac6748fc27c37d8965bc2d3557538247bd440243329bdde49fed0546",
      "proof": [
        "e217a07fd06d80bc0b1c4809d756d7efb252dcf8bc7ea2b78a601ddfdfd3bf1208a8c5",
        "f871a0d9be489cb097fe546b3dea08360bc560f8bbab1c94c0c5718b19d4eada2244ab8080a0ce33ee3a7a2b6986083e51692f89838976f49f349a433f779875a44e474dc53380a033a4e444c6db7d87ced9d7d80f04252e53bc0519861fb6785cd3204efa58fb6f8080808080808080808080",
        "ea8820726576696f7573a041f29e92ac6748fc27c37d8965bc2d3557538247bd440243329bdde49fed0546"
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
  "took": 102,
  "status": 201,
  "data": {
    "root": "720d4ba32d529ac41fdea1991e5dce08600604006aa363b348b78596b20519c7",
    "index": 2,
    "timestamp": 1584686209346,
    "count": 3,
    "previous": {
      "root": "47fd99e843e8b99c8816914982a155290f872b0e75bb1fa52af49194271c589e",
      "proof": [
        "f89180808080a000f539d1dc2693e8c2a150ff9ec86be4bc2a4f22a1753575d5b7b69f15fcdf6f8080a0b8c2574ad083c4d140f233dc5c2d014cfd104010c5855157d7d34e0d4788e804a026a697acbe5687c992f5c6c457790433b2d8c9f75411ba2f8f7a798fcdf9803d8080a056f55f959c146f21c55c69cc1008c5be395fe2e3603e89d31c594669ceccc17d8080808080",
        "f851a0040cc45d821ba3f9cce62941e308754e393b6ad5ed8e77d885be248782cede958080a0aae1464caf7c5872fd1bbad8980f405ae2649777846e5e7e29297cf49fb6fcf980808080808080808080808080",
        "ea8820726576696f7573a047fd99e843e8b99c8816914982a155290f872b0e75bb1fa52af49194271c589e"
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
  "took": 23,
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
  "took": 70,
  "status": 201,
  "data": {
    "root": "e9c99666000ce9097322cae7a5a5b06f3eb76ba0743b2753319660b821f024df",
    "index": 3,
    "timestamp": 1584686209438,
    "count": 0,
    "previous": {
      "root": "720d4ba32d529ac41fdea1991e5dce08600604006aa363b348b78596b20519c7",
      "proof": [
        "e217a0be7923c00bb178c2cbb8b439447b64d7d8608c0375bc7fc230febe129e1c33ee",
        "f851a0e5988183fa9499bfbd879235ce90dc13d7187337131184b016c962f10d841a838080a0c0a37b26763f3de2c23efb79c12a0760a1127bc301a19fe6dab57689d074da4980808080808080808080808080",
        "ea8820726576696f7573a0720d4ba32d529ac41fdea1991e5dce08600604006aa363b348b78596b20519c7"
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
  "took": 27,
  "status": 200,
  "data": {
    "count": 0,
    "previous": {
      "root": "e9c99666000ce9097322cae7a5a5b06f3eb76ba0743b2753319660b821f024df",
      "index": 3,
      "timestamp": 1584686209438,
      "count": 0,
      "previous": {
        "root": "720d4ba32d529ac41fdea1991e5dce08600604006aa363b348b78596b20519c7",
        "proof": [
          "e217a0be7923c00bb178c2cbb8b439447b64d7d8608c0375bc7fc230febe129e1c33ee",
          "f851a0e5988183fa9499bfbd879235ce90dc13d7187337131184b016c962f10d841a838080a0c0a37b26763f3de2c23efb79c12a0760a1127bc301a19fe6dab57689d074da4980808080808080808080808080",
          "ea8820726576696f7573a0720d4ba32d529ac41fdea1991e5dce08600604006aa363b348b78596b20519c7"
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
    "root": "47fd99e843e8b99c8816914982a155290f872b0e75bb1fa52af49194271c589e",
    "index": 1,
    "timestamp": 1584686209227,
    "count": 1,
    "previous": {
      "root": "41f29e92ac6748fc27c37d8965bc2d3557538247bd440243329bdde49fed0546",
      "proof": [
        "e217a07fd06d80bc0b1c4809d756d7efb252dcf8bc7ea2b78a601ddfdfd3bf1208a8c5",
        "f871a0d9be489cb097fe546b3dea08360bc560f8bbab1c94c0c5718b19d4eada2244ab8080a0ce33ee3a7a2b6986083e51692f89838976f49f349a433f779875a44e474dc53380a033a4e444c6db7d87ced9d7d80f04252e53bc0519861fb6785cd3204efa58fb6f8080808080808080808080",
        "ea8820726576696f7573a041f29e92ac6748fc27c37d8965bc2d3557538247bd440243329bdde49fed0546"
      ]
    }
  }
}
```

You can also retrieve it using its hash.

```bash
curl -XGET "$api/blocks/47fd99e843e8b99c8816914982a155290f872b0e75bb1fa52af49194271c589e?pretty=true"
```

```json
{
  "took": 6,
  "status": 200,
  "data": {
    "root": "47fd99e843e8b99c8816914982a155290f872b0e75bb1fa52af49194271c589e",
    "index": 1,
    "timestamp": 1584686209227,
    "count": 1,
    "previous": {
      "root": "41f29e92ac6748fc27c37d8965bc2d3557538247bd440243329bdde49fed0546",
      "proof": [
        "e217a07fd06d80bc0b1c4809d756d7efb252dcf8bc7ea2b78a601ddfdfd3bf1208a8c5",
        "f871a0d9be489cb097fe546b3dea08360bc560f8bbab1c94c0c5718b19d4eada2244ab8080a0ce33ee3a7a2b6986083e51692f89838976f49f349a433f779875a44e474dc53380a033a4e444c6db7d87ced9d7d80f04252e53bc0519861fb6785cd3204efa58fb6f8080808080808080808080",
        "ea8820726576696f7573a041f29e92ac6748fc27c37d8965bc2d3557538247bd440243329bdde49fed0546"
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
