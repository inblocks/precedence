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

**_precedence_** is edited by [**_inBlocks_**](https://inblocks.io) so you can rely on us for hosting the solution for you, supporting you during the deployment and providing you a very strong SLA.

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
  "took": 38,
  "status": 201,
  "data": {
    "provable": {
      "id": "5c89750b07bced2dbaa5d16eb46826fe3f06297cf5f930defe7169158b24fd9d",
      "seed": "bdec0dd5015e69d32ec8fd8a868ac44e0962ea64320e109ab48d789eab6b4421",
      "hash": "3de8d12c829a8e06ffeabac575aa3852f90d57160767832d6bdfde44bb3cc116",
      "chains": {},
      "previous": [],
      "address": "0d80666da65ba73600a4c7c8615ede83ac12914b54d0411127c26cdb22180596",
      "signature": "14592d327fdd14f4c851ce67f49c13b8b39792ac09c90b9ebda3b6ab47f82454"
    },
    "timestamp": 1586943700854,
    "seed": "d86323c48bbc83e658420137d368cbcaa68ad3db060a8f52e6fa328d818675b1",
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
    - `chains` is the root `chains` but where keys and values are the obfuscated fingerprint of their original value;
    - `previous` is the list of the record identifiers that are directly linked to this record;
    - `address` is the obfuscated fingerprint of root `address`;
    - `signature` is the obfuscated fingerprint of root `signature`;
  - `timestamp` is the record creation time (EPOCH millisecond);
  - `seed` is the random data used for obfuscation;
  - `hash` is the fingerprint of the original data;
  - `chains` is the map of relation between a chain and its last record identifier;
  - `address` is used for proof-of-ownership, corresponding to the public key of ECDSA key pair used to sign the root `hash`;
  - `signature` is the Ethereum signature of the root `hash`.

We can check that:
- the fingerprint of `seed` value is equal to `provable.seed` value:
```bash
echo -n 'd86323c48bbc83e658420137d368cbcaa68ad3db060a8f52e6fa328d818675b1 d86323c48bbc83e658420137d368cbcaa68ad3db060a8f52e6fa328d818675b1' | sha256sum
```
- the obfuscated fingerprint of the hash is equal to `provable.hash` value:
```bash
echo -n "d86323c48bbc83e658420137d368cbcaa68ad3db060a8f52e6fa328d818675b1 $(echo -n 'value 1' | sha256sum | cut -d' ' -f1)" | sha256sum
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
  "took": 13,
  "status": 201,
  "data": {
    "provable": {
      "id": "4cb00e1268a32986728731d9c4f83aaa24cb5131393f33471d9110decb6c526f",
      "seed": "1e597254c89c2e825707f74020f792b4733cbfda0dcebb076fbd3bc6a8751a73",
      "hash": "b1b5c148fe52f7eb614cf40758d02b01643f77c6fae1e0831af2bb29445599e7",
      "chains": {},
      "previous": [],
      "address": "9d219de6f76888eadbac06969e1d1b52bf771bccf2a07e55522abc5a0387877f",
      "signature": "236f41335cd6e35d628415a5c2763d3417b225f4de676c1174b1730c30d8ea55"
    },
    "timestamp": 1586943700998,
    "seed": "6311318358a71afe79d42f5044c513aa59a2d3fc47c1551a9f880011cfda9806",
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
curl -XGET "$api/records/4cb00e1268a32986728731d9c4f83aaa24cb5131393f33471d9110decb6c526f?data=true"
```

---

Let's create the same original data again.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```
```json
{
  "took": 8,
  "status": 201,
  "data": {
    "provable": {
      "id": "0459bfbde0852a6574284482f706a8f4bcd26c1047a5d3bbeed284dbb73a2f2e",
      "seed": "1cf9aaee273120fd4c9de4bd9040bf3b64bcc68cffb7167c454db9d8c51d8065",
      "hash": "536ad2b899d70e897a2ad9cae290aa79f489c09b7ad9a7834352a9c9c083040b",
      "chains": {},
      "previous": [],
      "address": "af96cbebaba4d0f4d6134f7f8183bef3b7a7dee27a1d2217fa237fd7431b8da5",
      "signature": "91d47d00b94dd32520e7c86f31a2357fcdd56216b182ee553f1a21108d4e731c"
    },
    "timestamp": 1586943701116,
    "seed": "2b2632c048053aaa2bdaf199c639e9050b9fbfbf548b06641fbf8bc35d06a605",
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
  "took": 11,
  "status": 201,
  "data": {
    "provable": {
      "id": "c62c73727112c371e0d453841fdcd4d71f2ddce548d8d886262a00fadcd9a512",
      "seed": "88e0778d377e593caa834a03247802d1ac196a2e41e33cfab4a457200441d0e1",
      "hash": "8fea85b172453ce2cd109accd2efcdd07a1685a6b9a9d851e8e426a079ed417b",
      "chains": {},
      "previous": [],
      "address": "804455fcdc3e008c7d409d231fb560cab9da9d201d0316c0e7726d73cec2cf76",
      "signature": "ec48f624958158894361938feaee33811c058552ef46df489a446cd47470ce9f"
    },
    "timestamp": 1586943701152,
    "seed": "1c737d77a1a1f6788fa56e7f1512139be4ef85addc04a9d7612e1f4ee536c9f4",
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
  "took": 10,
  "status": 201,
  "data": {
    "provable": {
      "id": "1ed9397b7ef55c4ec84596d3cd7ff775ec1e31e56498b423cd1912241d970612",
      "seed": "310b8391c69ba61d43672aef252140e19c527a9018661d17ae13ff2e41dc4474",
      "hash": "077c43d8ea09ba50ec30b7a0c74a9da1e695ba8725370d7db9edb857cb047da6",
      "chains": {},
      "previous": [],
      "address": "8d693ec12733f8b079e44c638b31cfbbac0dcbdb0ba8d22ade1dccfbf0a8a0fe",
      "signature": "462eea0293eeb51788936239ed6eae2348c39e8c4be91ff53b3419b48b603427"
    },
    "timestamp": 1586943701190,
    "seed": "5a1673706a0c4fb099e3bbb4e2e72c0e66d92d463aba9fc284d9f79dc0201e68",
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
  "took": 8,
  "status": 201,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "678df6dc906cbf3599971d6c1585a9dff9e6c3b8df95822784bc7e3444b0a132",
      "hash": "52d33422efcc497f309303a144d135b439987586f37cd6577e8db697a4c1d232",
      "chains": {},
      "previous": [],
      "address": "1f82be94e382b93683c1ca0a769c089b47cd77ab131f624cc99cc5a02c9d3d7e",
      "signature": "10468cf3496cbb83ced1ef83bf474b3e48f0dc6e6a6ed37b01575d447272cc99"
    },
    "timestamp": 1586943701220,
    "seed": "ec3a8c0439c1127e243ee780a043ed2f4635e83ed4176967e3a7c92664a18f5b",
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
  "took": 5,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "678df6dc906cbf3599971d6c1585a9dff9e6c3b8df95822784bc7e3444b0a132",
      "hash": "52d33422efcc497f309303a144d135b439987586f37cd6577e8db697a4c1d232",
      "chains": {},
      "previous": [],
      "address": "1f82be94e382b93683c1ca0a769c089b47cd77ab131f624cc99cc5a02c9d3d7e",
      "signature": "10468cf3496cbb83ced1ef83bf474b3e48f0dc6e6a6ed37b01575d447272cc99"
    },
    "timestamp": 1586943701220,
    "seed": "ec3a8c0439c1127e243ee780a043ed2f4635e83ed4176967e3a7c92664a18f5b",
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
  "took": 71,
  "status": 201,
  "data": {
    "index": 0,
    "root": "27d046333217d2be772104530c9414c2a52557a647c0e08d5de75df58babb3f7",
    "timestamp": 1586943701382,
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
  "took": 10,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "678df6dc906cbf3599971d6c1585a9dff9e6c3b8df95822784bc7e3444b0a132",
      "hash": "52d33422efcc497f309303a144d135b439987586f37cd6577e8db697a4c1d232",
      "chains": {},
      "previous": [],
      "address": "1f82be94e382b93683c1ca0a769c089b47cd77ab131f624cc99cc5a02c9d3d7e",
      "signature": "10468cf3496cbb83ced1ef83bf474b3e48f0dc6e6a6ed37b01575d447272cc99"
    },
    "timestamp": 1586943701220,
    "seed": "ec3a8c0439c1127e243ee780a043ed2f4635e83ed4176967e3a7c92664a18f5b",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "chains": {},
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "data": {
      "bytes": 7
    },
    "block": {
      "index": 0,
      "root": "27d046333217d2be772104530c9414c2a52557a647c0e08d5de75df58babb3f7",
      "timestamp": 1586943701382,
      "proof": [
        "f8f1a0bd5899e48994c46a329293df3172c87b9fbeb7e00162853374e084fd6c84d0b7a0c3c89fb568dd8598863d425ccaa3a1d7f849aa6cb3ccab4252eaf95f35af88e680a0f3c9402a787aea94c8bd00c4defc8efbefd98068857e2adad249c2f31fef6b08a008e422578242318ccd5c7a744dc71591ca7eb7353afd137bdc24142152a17718a0c180669fa0d9bdc79037bc05d6c010cc94fe377eadd4fd1e4c526ef0f94ee3b780a03e82c6d1f7c885d3f25002da12e87e4c7d8713bf84104111de545eb0161f15db80808080a0029b7d37a85f21e8a6d1610954b28b59872ddd1500fff7fab92936b1dafcfc5280808080",
        "f842a03a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a03e7c863c5363eb0de037e7d7e535e3a4a5d7e227e17d5b8da02257c43236199e"
      ]
    }
  }
}
```

The returned document contains information related to the block the record belongs to.

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
  "took": 5,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "678df6dc906cbf3599971d6c1585a9dff9e6c3b8df95822784bc7e3444b0a132",
      "hash": "52d33422efcc497f309303a144d135b439987586f37cd6577e8db697a4c1d232",
      "chains": {},
      "previous": [],
      "address": "1f82be94e382b93683c1ca0a769c089b47cd77ab131f624cc99cc5a02c9d3d7e",
      "signature": "10468cf3496cbb83ced1ef83bf474b3e48f0dc6e6a6ed37b01575d447272cc99"
    },
    "timestamp": 1586943701220,
    "seed": "ec3a8c0439c1127e243ee780a043ed2f4635e83ed4176967e3a7c92664a18f5b",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "chains": {},
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "block": {
      "index": 0,
      "root": "27d046333217d2be772104530c9414c2a52557a647c0e08d5de75df58babb3f7",
      "timestamp": 1586943701382,
      "proof": [
        "f8f1a0bd5899e48994c46a329293df3172c87b9fbeb7e00162853374e084fd6c84d0b7a0c3c89fb568dd8598863d425ccaa3a1d7f849aa6cb3ccab4252eaf95f35af88e680a0f3c9402a787aea94c8bd00c4defc8efbefd98068857e2adad249c2f31fef6b08a008e422578242318ccd5c7a744dc71591ca7eb7353afd137bdc24142152a17718a0c180669fa0d9bdc79037bc05d6c010cc94fe377eadd4fd1e4c526ef0f94ee3b780a03e82c6d1f7c885d3f25002da12e87e4c7d8713bf84104111de545eb0161f15db80808080a0029b7d37a85f21e8a6d1610954b28b59872ddd1500fff7fab92936b1dafcfc5280808080",
        "f842a03a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a03e7c863c5363eb0de037e7d7e535e3a4a5d7e227e17d5b8da02257c43236199e"
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
  "took": 9,
  "status": 201,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "59e4b259d7884bafff084fd92f97eb35e81637ba90c6aba39d86edc9b7adc11c",
      "hash": "abc4912f67a96da20ae8edb134940de466a876883444bd55392a350f505e927d",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ],
      "address": "be9d4cbdce2e2fdbea4633916ea5da817a7506d06dd7a0c77f35e02576b2bc58",
      "signature": "c378e410f054b897373cafb25fb8c78af6305dc5f344402be8acbd26304b2085"
    },
    "timestamp": 1586943701559,
    "seed": "2e7537ac999c154f26c1f6db680a74d85c702773d0f244c30262bcf6ce2a7c02",
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
  "took": 11,
  "status": 201,
  "data": {
    "provable": {
      "id": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951",
      "seed": "1a31577411c9d2113b456f93cc4f02dd3e46d761ddfa19ca2520a3a8356b05c6",
      "hash": "270b1dfc6a533a92eccf40c954ff69be7bf73b46ad34610022791db5f445b036",
      "chains": {
        "046b8f5c3838f00a01c1d74a1f0edbf5c084964e871d0df54cdb6c0bd1dfb567": null
      },
      "previous": [],
      "address": "ed2fd552ae271c9f1f62fea0340b5ff46963b85858e19553258e5ace706ff377",
      "signature": "ccac82540eebab148a1d655c59819898502218f422b33c75b5c10a69a94ea5b7"
    },
    "timestamp": 1586943701595,
    "seed": "f340b962dec300ff7dd176d92aed6450a77003a3d03b73f01cb57d180425c5a6",
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
  "took": 14,
  "status": 201,
  "data": {
    "provable": {
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "seed": "94a98a2a30ad41832bf524a0ea1ece7c5dee015a785910d7dbbab30226715c3a",
      "hash": "88d7d782931a525b9c9e9438fe2d46b5c6b45e7dd843e06fa4468617b4946c33",
      "chains": {
        "75e7db6f4670f1a2f71e4bbf758d3d2bc30ad8c3e52b82f5dc89e93199728b4d": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ],
      "address": "e1f40d966cb211c7a886a73c28b1c336e8549dc76e217f95dd7bebc39217fd79",
      "signature": "db8e0af1c6e3718804b9d06805b66e5dc467b345535dd7eddbde8b8f1bfe5180"
    },
    "timestamp": 1586943701636,
    "seed": "f7a2f7002e8729ccceb374db92822431126f8583fb3358a08136eddf14e8db1c",
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
- the obfuscated fingerprint of `chain1` is equal to `75e7db6f4670f1a2f71e4bbf758d3d2bc30ad8c3e52b82f5dc89e93199728b4d`:
```bash
echo -n "f7a2f7002e8729ccceb374db92822431126f8583fb3358a08136eddf14e8db1c chain1" | sha256sum
```
- the `chains.chain1` value is equal to the `provable.chains.75e7db6f4670f1a2f71e4bbf758d3d2bc30ad8c3e52b82f5dc89e93199728b4d` value: `893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951`.

---

To retrieve the record currently refered by a chain name (i.e. the last record of the chain), you can use the following API call:

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 2,
  "status": 200,
  "data": {
    "provable": {
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "seed": "94a98a2a30ad41832bf524a0ea1ece7c5dee015a785910d7dbbab30226715c3a",
      "hash": "88d7d782931a525b9c9e9438fe2d46b5c6b45e7dd843e06fa4468617b4946c33",
      "chains": {
        "75e7db6f4670f1a2f71e4bbf758d3d2bc30ad8c3e52b82f5dc89e93199728b4d": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ],
      "address": "e1f40d966cb211c7a886a73c28b1c336e8549dc76e217f95dd7bebc39217fd79",
      "signature": "db8e0af1c6e3718804b9d06805b66e5dc467b345535dd7eddbde8b8f1bfe5180"
    },
    "timestamp": 1586943701636,
    "seed": "f7a2f7002e8729ccceb374db92822431126f8583fb3358a08136eddf14e8db1c",
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
  "took": 12,
  "status": 201,
  "data": {
    "provable": {
      "id": "0003275d55e40c7346d3acc97ee13ef85470f4a032bea1589cc58261e9e04a0e",
      "seed": "c5d4a6550a6417a8d13df0dbab50f155b5a7b749021a047da8536616fbfe7f94",
      "hash": "c446b788f9c626f330b860517384128b04229474d7347fb9a91415325117b2f6",
      "chains": {
        "ff528be20fae1d8ea812c5ddc7971fef91e49ab5e0010a73b7f2fb07681d135c": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "5c0a63a2536835f10b1f4f470fc2a0d158c4342a2f0e16e988486e306f6de6c6": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ],
      "address": "9bff8f93b42b1f7dc49ab0fb93e1d685106814492211db7a2a111bc67dd0a683",
      "signature": "48a0c1bf6630406288d8c36d2828113f22a151bd0eb52fdd4746ea8014382088"
    },
    "timestamp": 1586943701803,
    "seed": "8867c4a328f630be32cd9624ad9ec51e0d2190c6bf91177778264185659c860f",
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
  "took": 3,
  "status": 200,
  "data": {
    "provable": {
      "id": "0003275d55e40c7346d3acc97ee13ef85470f4a032bea1589cc58261e9e04a0e",
      "seed": "c5d4a6550a6417a8d13df0dbab50f155b5a7b749021a047da8536616fbfe7f94",
      "hash": "c446b788f9c626f330b860517384128b04229474d7347fb9a91415325117b2f6",
      "chains": {
        "ff528be20fae1d8ea812c5ddc7971fef91e49ab5e0010a73b7f2fb07681d135c": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "5c0a63a2536835f10b1f4f470fc2a0d158c4342a2f0e16e988486e306f6de6c6": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ],
      "address": "9bff8f93b42b1f7dc49ab0fb93e1d685106814492211db7a2a111bc67dd0a683",
      "signature": "48a0c1bf6630406288d8c36d2828113f22a151bd0eb52fdd4746ea8014382088"
    },
    "timestamp": 1586943701803,
    "seed": "8867c4a328f630be32cd9624ad9ec51e0d2190c6bf91177778264185659c860f",
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
  "took": 1,
  "status": 200,
  "data": {
    "provable": {
      "id": "0003275d55e40c7346d3acc97ee13ef85470f4a032bea1589cc58261e9e04a0e",
      "seed": "c5d4a6550a6417a8d13df0dbab50f155b5a7b749021a047da8536616fbfe7f94",
      "hash": "c446b788f9c626f330b860517384128b04229474d7347fb9a91415325117b2f6",
      "chains": {
        "ff528be20fae1d8ea812c5ddc7971fef91e49ab5e0010a73b7f2fb07681d135c": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "5c0a63a2536835f10b1f4f470fc2a0d158c4342a2f0e16e988486e306f6de6c6": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ],
      "address": "9bff8f93b42b1f7dc49ab0fb93e1d685106814492211db7a2a111bc67dd0a683",
      "signature": "48a0c1bf6630406288d8c36d2828113f22a151bd0eb52fdd4746ea8014382088"
    },
    "timestamp": 1586943701803,
    "seed": "8867c4a328f630be32cd9624ad9ec51e0d2190c6bf91177778264185659c860f",
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
  "took": 3,
  "status": 200,
  "data": {
    "id": "0003275d55e40c7346d3acc97ee13ef85470f4a032bea1589cc58261e9e04a0e"
  }
}
```

The response gives you the last record id.

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
      "id": "0003275d55e40c7346d3acc97ee13ef85470f4a032bea1589cc58261e9e04a0e",
      "seed": "c5d4a6550a6417a8d13df0dbab50f155b5a7b749021a047da8536616fbfe7f94",
      "hash": "c446b788f9c626f330b860517384128b04229474d7347fb9a91415325117b2f6",
      "chains": {
        "ff528be20fae1d8ea812c5ddc7971fef91e49ab5e0010a73b7f2fb07681d135c": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "5c0a63a2536835f10b1f4f470fc2a0d158c4342a2f0e16e988486e306f6de6c6": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ],
      "address": "9bff8f93b42b1f7dc49ab0fb93e1d685106814492211db7a2a111bc67dd0a683",
      "signature": "48a0c1bf6630406288d8c36d2828113f22a151bd0eb52fdd4746ea8014382088"
    },
    "timestamp": 1586943701803,
    "seed": "8867c4a328f630be32cd9624ad9ec51e0d2190c6bf91177778264185659c860f",
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
  "took": 2,
  "status": 200,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "59e4b259d7884bafff084fd92f97eb35e81637ba90c6aba39d86edc9b7adc11c",
      "hash": "abc4912f67a96da20ae8edb134940de466a876883444bd55392a350f505e927d",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ],
      "address": "be9d4cbdce2e2fdbea4633916ea5da817a7506d06dd7a0c77f35e02576b2bc58",
      "signature": "c378e410f054b897373cafb25fb8c78af6305dc5f344402be8acbd26304b2085"
    },
    "timestamp": 1586943701559,
    "seed": "2e7537ac999c154f26c1f6db680a74d85c702773d0f244c30262bcf6ce2a7c02",
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
  "took": 27,
  "status": 201,
  "data": {
    "index": 1,
    "root": "59cf7456a02ef842cb6b1d848ca0629b139da84877a3db0b981733a6619bc235",
    "timestamp": 1586943702025,
    "count": 1,
    "previous": {
      "root": "27d046333217d2be772104530c9414c2a52557a647c0e08d5de75df58babb3f7",
      "proof": [
        "e217a0734511aee3e1bc0371e179321fd629d252dfa64cc6425a61953965316f13224c",
        "f871a014435818d91527af51393539ea61a76e5dc5356fd92796fa3686a8b1c685728e8080a0e7dd09b5787bfa9ab1602431023ae157c6d2805cb2bff5d7712442e4a099920780a0028fa281d9aa44d4f75b225b768d4e10a65654aac0fa02fabebc24557bb447098080808080808080808080",
        "ea8820726576696f7573a027d046333217d2be772104530c9414c2a52557a647c0e08d5de75df58babb3f7"
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
  "took": 31,
  "status": 201,
  "data": {
    "index": 2,
    "root": "ad92e560fc5f015048ec2e4365fc32df7cc8ae8c799e02825347ef3be35563f9",
    "timestamp": 1586943702084,
    "count": 3,
    "previous": {
      "root": "59cf7456a02ef842cb6b1d848ca0629b139da84877a3db0b981733a6619bc235",
      "proof": [
        "f891a09c82087cd3fd12d04584140d142b4518761bba83d9ea3d3a8f0a8a5763230285808080a09d0d685972578ba90f341b8e062f1b4437734acc254039730b5fc83e20aefa628080a0401f6784185659d54fae44e2a82f91a4d0cfa20ebd184ad79826e06cd3f22930a05476c2d0eb9ba2ebff9382234af879a3d951149c5e4dfe3fb8bbc68213e0ae878080808080808080",
        "f851a08513201653fd360f98eb7008d70b3268766f68676df2056b3358f0743cc2e0708080a0d07766d11ea9863d8bc904800141171b549f84e7d4bbfc9006b969b178cc09ab80808080808080808080808080",
        "ea8820726576696f7573a059cf7456a02ef842cb6b1d848ca0629b139da84877a3db0b981733a6619bc235"
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
  "took": 13,
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
  "took": 19,
  "status": 201,
  "data": {
    "index": 3,
    "root": "ad03acc1095cde8db7d49596e15de29299557e70d665e292269faf9cc7d0dc87",
    "timestamp": 1586943702175,
    "count": 0,
    "previous": {
      "root": "ad92e560fc5f015048ec2e4365fc32df7cc8ae8c799e02825347ef3be35563f9",
      "proof": [
        "e217a0a1656d0c8a2fc675dfa22648c17dd1627c4edb542ff883f3ac6a721c650e22c2",
        "f851a089916489630c28154876ae3de149b1537a6b687003849ddafd466061faadb8628080a07a803ba3a2ba88adb0d7801b62a07d739bf8d426aa5454169fe8bd357963783680808080808080808080808080",
        "ea8820726576696f7573a0ad92e560fc5f015048ec2e4365fc32df7cc8ae8c799e02825347ef3be35563f9"
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
      "index": 3,
      "root": "ad03acc1095cde8db7d49596e15de29299557e70d665e292269faf9cc7d0dc87",
      "timestamp": 1586943702175,
      "count": 0,
      "previous": {
        "root": "ad92e560fc5f015048ec2e4365fc32df7cc8ae8c799e02825347ef3be35563f9",
        "proof": [
          "e217a0a1656d0c8a2fc675dfa22648c17dd1627c4edb542ff883f3ac6a721c650e22c2",
          "f851a089916489630c28154876ae3de149b1537a6b687003849ddafd466061faadb8628080a07a803ba3a2ba88adb0d7801b62a07d739bf8d426aa5454169fe8bd357963783680808080808080808080808080",
          "ea8820726576696f7573a0ad92e560fc5f015048ec2e4365fc32df7cc8ae8c799e02825347ef3be35563f9"
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
  "took": 2,
  "status": 200,
  "data": {
    "index": 1,
    "root": "59cf7456a02ef842cb6b1d848ca0629b139da84877a3db0b981733a6619bc235",
    "timestamp": 1586943702025,
    "count": 1,
    "previous": {
      "root": "27d046333217d2be772104530c9414c2a52557a647c0e08d5de75df58babb3f7",
      "proof": [
        "e217a0734511aee3e1bc0371e179321fd629d252dfa64cc6425a61953965316f13224c",
        "f871a014435818d91527af51393539ea61a76e5dc5356fd92796fa3686a8b1c685728e8080a0e7dd09b5787bfa9ab1602431023ae157c6d2805cb2bff5d7712442e4a099920780a0028fa281d9aa44d4f75b225b768d4e10a65654aac0fa02fabebc24557bb447098080808080808080808080",
        "ea8820726576696f7573a027d046333217d2be772104530c9414c2a52557a647c0e08d5de75df58babb3f7"
      ]
    }
  }
}
```

You can also retrieve it using its hash.

```bash
curl -XGET "$api/blocks/59cf7456a02ef842cb6b1d848ca0629b139da84877a3db0b981733a6619bc235?pretty=true"
```

```json
{
  "took": 2,
  "status": 200,
  "data": {
    "index": 1,
    "root": "59cf7456a02ef842cb6b1d848ca0629b139da84877a3db0b981733a6619bc235",
    "timestamp": 1586943702025,
    "count": 1,
    "previous": {
      "root": "27d046333217d2be772104530c9414c2a52557a647c0e08d5de75df58babb3f7",
      "proof": [
        "e217a0734511aee3e1bc0371e179321fd629d252dfa64cc6425a61953965316f13224c",
        "f871a014435818d91527af51393539ea61a76e5dc5356fd92796fa3686a8b1c685728e8080a0e7dd09b5787bfa9ab1602431023ae157c6d2805cb2bff5d7712442e4a099920780a0028fa281d9aa44d4f75b225b768d4e10a65654aac0fa02fabebc24557bb447098080808080808080808080",
        "ea8820726576696f7573a027d046333217d2be772104530c9414c2a52557a647c0e08d5de75df58babb3f7"
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
