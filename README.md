# What's this software for?

**_precedence_ brings secure blockchain-powered traceability features to your already existing legacy information system!**

**_precedence_** is the first open source ledger allowing non blockchain specialist to put in place a transparent, immutable, and cryptographically verifiable transaction log with a minimum effort and fully integrated to their existing database or file system.

**_precedence_** is compliant with multiple data sources:
- file system
- SQL databases
- noSQL databases
- stream processing

By connecting your data source to **_precedence_** you automatically get:
- proof-of-existence on every data connected
- proof-of-ownership compliant with your PKI
- automatic versioning system for every pieces of information

All these features allow you bring secure blockchain-powered traceability features to your legacy information system.

**_precedence_** is agnostic to the data type considered and can be use to bring immutable and undeniable traceability to every data that you already operate in your information system. Your system is most likely already compliant and there is no need to apply modification to it to start using **_precedence_**.

**_precedence_** is edited by [**_inBlocks_**](https://precedence.inblocks.io) so you can rely on us for hosting the solution for you, supporting you during the deployment and providing you a very strong SLA.






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

Make sure the `api` environment variable is the API endpoint you want to use. We assume here that you have previously deployed the API in a docker container on your local machine.

```bash
export api="http://localhost:9000"```

## Record API calls

To insert a first record you can use the following command. By default the data is not stored in precedence, the only data-related information stored is its fingerprint (sha-256).

```bash
$ curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true" -d "value 1"
```

You will find below a response example.

```json
{
  "took": 274,
  "status": 200,
  "data": {
    "provable": {
      "seed": "fadef06575c8a9d999876a1a40a6f65286ba4f495de2c8163aff09bc636cbc4c",
      "id": "114290285af47219d9618c28c29a014650c4a08887126f120cedad51d8f629d4",
      "data": "4dd4ef9562f44c3472993173a4dd4bea89f19575943053e95954765ffb595858",
      "chains": {},
      "previous": []
    },
    "seed": "d50a590c04e3ab684d0a31f37a07b05d0504ae289e7324c4104339786ef9581b",
    "hash": "ceaaee8f12b3cc721392abaf209ba7d49cb8c65c8b2427976cdd5f622303cfa5",
    "timestamp": 1557159796420,
    "chains": {}
  }
}
```

For sure you need some explanation about the returned JSON response:
- `took` is the number of millisecond this request needed to be processed at server-side;
- `status` is the HTTP status code;
- `data` contains every piece of information related to the data you provided;
  - `provable`contains the information that you will be able to prove using *precedence*;
    - `seed` is a random data decided by the precedence core that is used for obfuscation, in this field you have the obfuscated version of the seed;
    - `id` is the record identifier;
    - `data` is the hash (SHA-256) of the data you provided;
    - `chains` contains the map of relation between chain label (provided as parameter) and record identifiers;
    - `previous` contains the list od the record identifiers that are directly linked to this record;
  - `seed` is the random data used for hash obfuscation, it is part of the provable fields;
  - `hash`is the SHA-256 fingerprint of the `provable` object;
  - `timestamp` is the record insertion time (EPOCH millisecond);
  - `chains` is a object related to the chain paramater provided, more detailed information is provided below;

---

Let's insert another record.

```bash
$ curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```

```json
{
  "took": 22,
  "status": 200,
  "data": {
    "provable": {
      "seed": "d675cc48bbc355538042d618411443a9b433d6c4f3a77b538b0950aa780efc95",
      "id": "504a438215f86c22740307dc40c6cf816882bab329ed561cf7b12ca23481218d",
      "data": "60814a86458afd5fbf94ca89839d6c3f5347b31c5d655716f76138ea88d8c96e",
      "chains": {},
      "previous": []
    },
    "seed": "e5565aed7d904fd17b1c7497ffe7fc7d975d28334f44a2c2e4751f15cf2de742",
    "hash": "ced3ec92ab80dbd94f3a2d1e72f6d7d71c0e133a1606c77328de1c142c2b0042",
    "timestamp": 1557160035896,
    "chains": {},
    "data": "dmFsdWUgMg=="
  }
}
```

In the response you can see that the data you sent has been persisted in precedence in the `data.data` field using base64 encoding.

To decode the data you can run:

```bash
$ echo 'dmFsdWUgMg==' | base64 --decode
```

---

Let's insert the same data again.

```bash
$ curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```
```json
{
  "took": 19,
  "status": 200,
  "data": {
    "provable": {
      "seed": "a1962477274f974036ba8e68566c9fc9315e5df8ec84b1da182cbe3c82c4fe21",
      "id": "955a66b5cb638beff845175fe787448c0e69f9b335db0d955ee95943e10bb70d",
      "data": "bfc97e575e4f1860a3da43908ac0ba4bd9d517564f0d54a80e21390549526de9",
      "chains": {},
      "previous": []
    },
    "seed": "3693dad63176be077a82c3f4ec1441316757d2aedc35f199d9a279677ebdf200",
    "hash": "8ffc534528df9dd8347e6e2448fd0c8de165565cbf0fdd5bb83b22546ff7a765",
    "timestamp": 1557160096546,
    "chains": {},
    "data": "dmFsdWUgMg=="
  }
}
```

All the values of the `provable` sub-object of the response are different from the previous ones, even with the same data value. This is made possible by using the `seed` in the hashing process. This way the `provable` fields are 100% obfuscated and can not lead to data leaking.

---

It is also possible to set an `hash` parameter in the record insert request to make sure that there is no network failure during the sending of the request.

```bash
$ curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true&hash=085a57ddb929d1a2853aad31940d6e718918762b8db43f299e86fe732d13d6b9" -d "value 4"
```

```json
{
  "took": 21,
  "status": 200,
  "data": {
    "provable": {
      "seed": "66454b08b9fa4ec4fc1b54791a373c3b85685031a160d01d7ae1a5599c15aed8",
      "id": "2583c5192f24ac058b86e3ff48b93f54a9822d4e6cbd44e15c2906c1fac4de79",
      "data": "8d64136621c7eac8df7d7a404c012a9dbee75b3c54f63651fe4758e8eee59d06",
      "chains": {},
      "previous": []
    },
    "seed": "75b024fba97638caeb6249a36a27ebf848145574a38496a9a9af68ca108086a2",
    "hash": "a964e0ea00943087e435d8a2c3bb440c4d69249563e526f73ee0a048e7a7e600",
    "timestamp": 1557160161839,
    "chains": {},
    "data": "dmFsdWUgNA=="
  }
}
```

By doing so the received data is hashed at server-side to make sure that the received data is consistent with the sent data.

---

You can specify an identifier for your record. This identifier must be unique and can not be used to insert multiple records.

```bash
$ curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true&id=E518B4BB-2668-4ED7-B9E3-E63803BCAC93" -d "value 5"
```

```json
{
  "took": 20,
  "status": 200,
  "data": {
    "provable": {
      "seed": "6a707b19a5ab1e7d4bca514ea568877b594e5c5d92cf11a250a8da1823625288",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "469e3cabc2b9c89d460039995f5d59aa9eda2ab499fe20cca53db54649dd38e1",
      "chains": {},
      "previous": []
    },
    "seed": "2bbe2df99d414b32efe7dec1d30b1663e1622c7e652113817a0ed37656f54330",
    "hash": "169a87cf819b379f791b7bba5898974611e0f44348315f86df4412c227dfddcf",
    "timestamp": 155716018319,
    "chains": {},
    "data": "dmFsdWUgNQ=="
  }
}
```

The computed identifier that is returned is based on the identifier you provided.

If you try to insert a new record with the same identifier you will get an error.

```bash
$ curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true&id=E518B4BB-2668-4ED7-B9E3-E63803BCAC93" -d "value 5.1"
```

```json
{
  "took": 16,
  "status": 409,
  "error": 1006,
  "message": "Record \"3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4\" already exists",
  "data": {
    "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
  }
}
```

---

To read a record you can use its identifier.

```bash
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 15,
  "status": 200,
  "data": {
    "provable": {
      "seed": "6a707b19a5ab1e7d4bca514ea568877b594e5c5d92cf11a250a8da1823625288",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "469e3cabc2b9c89d460039995f5d59aa9eda2ab499fe20cca53db54649dd38e1",
      "chains": {},
      "previous": []
    },
    "seed": "2bbe2df99d414b32efe7dec1d30b1663e1622c7e652113817a0ed37656f54330",
    "hash": "169a87cf819b379f791b7bba5898974611e0f44348315f86df4412c227dfddcf",
    "timestamp": 155716018319,
    "chains": {},
    "data": "dmFsdWUgNQ==",
    "block": null
  }
}
```

The record is not part of a block so the `block` value is `null`. To create a new block you can run the following command. To know more about block management check the dedicated `block` documentation section below.

```bash
$ curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 112,
  "status": 200,
  "data": {
    "root": "71ea7073b2e9ff7bfde5b3e003fc45e8ca0cc279d6039fdf0aaf1340cfe655df",
    "index": 1,
    "timestamp": "1557160272000",
    "count": 5,
    "previous": null
  }
}
```

The block is created, you can now get the record again and retrieve additionnal information.

```bash
$ curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 44,
  "status": 200,
  "data": {
    "provable": {
      "seed": "6a707b19a5ab1e7d4bca514ea568877b594e5c5d92cf11a250a8da1823625288",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "469e3cabc2b9c89d460039995f5d59aa9eda2ab499fe20cca53db54649dd38e1",
      "chains": {},
      "previous": []
    },
    "seed": "2bbe2df99d414b32efe7dec1d30b1663e1622c7e652113817a0ed37656f54330",
    "hash": "169a87cf819b379f791b7bba5898974611e0f44348315f86df4412c227dfddcf",
    "timestamp": 155716018319,
    "chains": {},
    "data": "dmFsdWUgNQ==",
    "block": {
      "index": 1,
      "proof": [
        "e213a0847b88c9d4af4af859d84e5672babf4e7e6d8d84210ad75217a3fb72ce7f0e8d",
        "f8b180a01795484721f76210427b0401c8bfffceeb5ae70000d5354ddefcc17841624d23a0108eb94d994130cb89ccc8ad027d0d1fb625401f30b88e3e2941a9ab139ce211a045f178dc90e69252533488d867c6fa1374a24d08c70a97c5d8eb03ca21ca7bb680a0ecd7f6e8bcde409cbfe1debe19ee24c8c58a8023a4ce572d79592e6723f132f8808080a0ec21f311115bea6227ee859710c21b9b1d0f7074b5a62383b841f50273eabb2c80808080808080",
        "f884b84020613331643536373437373835666166653733626336373435613164323163366238633338643134623735373366613366653330373435616465643165326334b84031363961383763663831396233373966373931623762626135383938393734363131653066343433343833313566383664663434313263323237646664646366"
      ]
    }
  }
}
```

The returned document contains information related to the block the record belongs to;
- `index` is the block number that contains this record;
- `proof` is an array that contains the agnostic proof-of-existence of this record is the block.

---

You can delete the data that is stored in the record. The record itself can not be deleted because it would cause chain inconsitency.

```bash
$ curl -XDELETE "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 12,
  "status": 200,
  "data": {
    "deleted": 1
  }
}
```

The data record has been deleted, let's retrieve it again.

```bash
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 41,
  "status": 200,
  "data": {
    "provable": {
      "seed": "6a707b19a5ab1e7d4bca514ea568877b594e5c5d92cf11a250a8da1823625288",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "469e3cabc2b9c89d460039995f5d59aa9eda2ab499fe20cca53db54649dd38e1",
      "chains": {},
      "previous": []
    },
    "seed": "2bbe2df99d414b32efe7dec1d30b1663e1622c7e652113817a0ed37656f54330",
    "hash": "169a87cf819b379f791b7bba5898974611e0f44348315f86df4412c227dfddcf",
    "timestamp": 155716018319,
    "deleted": true,
    "block": {
      "index": 1,
      "proof": [
        "e213a0847b88c9d4af4af859d84e5672babf4e7e6d8d84210ad75217a3fb72ce7f0e8d",
        "f8b180a01795484721f76210427b0401c8bfffceeb5ae70000d5354ddefcc17841624d23a0108eb94d994130cb89ccc8ad027d0d1fb625401f30b88e3e2941a9ab139ce211a045f178dc90e69252533488d867c6fa1374a24d08c70a97c5d8eb03ca21ca7bb680a0ecd7f6e8bcde409cbfe1debe19ee24c8c58a8023a4ce572d79592e6723f132f8808080a0ec21f311115bea6227ee859710c21b9b1d0f7074b5a62383b841f50273eabb2c80808080808080",
        "f884b84020613331643536373437373835666166653733626336373435613164323163366238633338643134623735373366613366653330373435616465643165326334b84031363961383763663831396233373966373931623762626135383938393734363131653066343433343833313566383664663434313263323237646664646366"
      ]
    }
  }
}
```

The original `data` field has been removed and a new boolean field `deleted` has ben added. The record can still be proved to exist but the data has been removed from precedence. If you kept it somewhere then the proof is still valid.

---

To insert a record as a new state of a already inserted record we should use the `previous` parameter. It allows you to link you records with each other.

```bash
$ curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=61E51581-7763-4486-BF04-35045DC7A0D3&previous=3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4" -d "value 6"
```

```json
{
  "took": 22,
  "status": 200,
  "data": {
    "provable": {
      "seed": "ebe7bf61561d1723ed2aa082ccedfe313c51ce4e937a9b059c6440524331a251",
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "data": "78e1f560ae29432f1872c588000486641c4e878cec0285f2d05435d6d3822501",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "seed": "7082c8f235c66f3ba7952fd5682f6b8eefac25a85395a4f2bf04f5a1196adb8c",
    "hash": "75df9dc45052c7e13f6ae2eff1985d83352d497d396d0401f2f376e4536a9dc8",
    "timestamp": 155716042953,
    "chains": {}
  }
}
```

The `previous` field contains the parameter you provided. This parameter must be the identifier that was returned at insertion time, you can not use your own identifier to link your records. If you want to link your record based on a label that you control use the chain parameter (this is explain in the chain section).

---

You can delete a record data and all the data of the record specified in the previous field transitively by running the following command

```bash
$ curl -XDELETE "$api/records/75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6?pretty=true&previous=true"
```

```json
{
  "took": 7,
  "status": 200,
  "data": {
    "deleted": 1
  }
}
```

Only one record data was deleted because the record identified by `3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4` was already deleted.

## Chain API calls

The chain API calls have been designed to facilitate the record insertion and the creation of links (using the `previous` field) between those records.

To insert a record in the precedence system by using the chain method you need to use the `chain` parameter.

```bash
$ curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=4FF6B617-F1CF-4F10-A314-4C7733A9DB7F&chain=chain1" -d "value 7"
```

```json
{
  "took": 26,
  "status": 200,
  "data": {
    "provable": {
      "seed": "a70fcb7aadf38eeca6757013776ac4879860e465a71ecf445f30b08f58104d78",
      "id": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951",
      "data": "79420bbfd036285c51401fbd83d329d969514a54dbf6ef62053aae2f870b743e",
      "chains": {
        "d18ccdc4f4042ea2d0d471efe2912e722e507081df1757d5b4e8410745524fd5": null
      },
      "previous": []
    },
    "seed": "a14b5a1fde68d8c2f6cfa34c0195a63e65ae5fd5d2978bfcac8343af57d18f4c",
    "hash": "97d8fb7661c1113ccb1eb9a9e58cf78fde72726c5b73a27f29cbd4b516e2c5ac",
    "timestamp": 1557160540516,
    "chains": {
      "chain1": null
    }
  }
}
```

The field `chains` contains information about the chain state at insertion time. In this scenario the chain `chain1` was never used before so this newly created node is the first and the last node of this chain. Because there was no nodes in this chain the value set in `chain.chain1` is `null`. When the chain exists, the inserted node is appended behind the last node of the chain specified in the parameter `chain`. In the same time, and in a atomic way, the newly inserted node become the last node of the chain and can be refered to using the `chain1` label.

Let's insert a second record using this `chain1` label.

```bash
$ curl -XPOST -H "content-type: application/octet-stream" "$api/records?pretty=true&id=2B6C83EF-474D-4A15-B1D5-A1EC7E8226CF&chain=chain1" -d "value 8"
```

```json
{
  "took": 26,
  "status": 200,
  "data": {
    "provable": {
      "seed": "f8f3c5c45b6390f5322bc8b918f767c5efeb92fe7e7f74b9f7828d900701004a",
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "data": "834a7d114eefce4c7adce7f12e7c92d35c4a9f796206cc1fdb18287be6db16db",
      "chains": {
        "75a2d11434e008de955d02362bbaf6a91b4b94fb9d55c4f85c3081a55e324966": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "2b97c0a7d3a7412d890097fdae37863897bf30487f44bd80cf6c48bb7bae7041",
    "hash": "cb11ac677d6a2f344ac360ca923367c28158dd14fbf9f8529c215c9bcdf578ae",
    "timestamp": 1557160629323,
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    }
  }
}
```

The field `chains` contains the key `chains1` whose value is the record identifier of the previously inserted record. The record has been appended at the end of the chain and the label `chain1` now refers to the newly inserted record. This information is provable because it is part of the record definition. The key stored in `provable.chains` has been ofuscated to avoid any data leak and for GDPR compliancy (these fields can not be removed except by deleting the entire chain).

---

It is possible to retrieve the record currently refered by a chain name.

```bash
$ curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 16,
  "status": 200,
  "data": {
    "provable": {
      "seed": "f8f3c5c45b6390f5322bc8b918f767c5efeb92fe7e7f74b9f7828d900701004a",
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "data": "834a7d114eefce4c7adce7f12e7c92d35c4a9f796206cc1fdb18287be6db16db",
      "chains": {
        "75a2d11434e008de955d02362bbaf6a91b4b94fb9d55c4f85c3081a55e324966": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "2b97c0a7d3a7412d890097fdae37863897bf30487f44bd80cf6c48bb7bae7041",
    "hash": "cb11ac677d6a2f344ac360ca923367c28158dd14fbf9f8529c215c9bcdf578ae",
    "timestamp": 1557160629323,
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    },
    "block": null
  }
}
```

---

You can insert a record by setting multiple chain names and the previous parameter.

```bash
# multiple chains and or previous, 2 chains 2 previous -> 2 previous and not 4 because chain2 null (first), chain1 -> 893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951
$ curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&chain=chain1&chain=chain2&previous=893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951&previous=44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3" -d "value 9"
```

```json
{
  "took": 32,
  "status": 200,
  "data": {
    "provable": {
      "seed": "28dc028ddcd420cd2c3016829ac69a2b38d6756bed0a389080f74209cb308a7d",
      "id": "65825ae1a7a69f20c2a328d6aad21f23cebce92ad99c985a0e09c4c726deadd8",
      "data": "277f0da41c1523fa3b9587b22f685f02fe08317c8991621b6e1db8b7de677ecd",
      "chains": {
        "9ae931a0d4b381b9ae2ca3c5ea74b4f111fa1bfdada19c615ee4638bf7e8ce19": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "cdfb1e54ed900b392ce868debbe0f221eeb6521383e060054ab7417b8112b24c": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "2b553593fee7ea62389c75798d4e05347c0f69d2ed8dddf7d0d228e6c5c5851b",
    "hash": "0df73f226b212bf62bccd572c6e39a5b5eeca2216e0af9df6177bc8e9697002a",
    "timestamp": 1557160682439,
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    }
  }
}
```

In this case the precedence server computes at insertion time and in a atomic way the previous record of this newly inserted record. It uses the chain parameters to get the list of the previous records, it merges this set to the set defined using the `previous` parameter. This atomic operation also make sure that this node is considered as the last node of the chains set in parameter.

---

The previous inserted record is the last records on both `chain1` and `chain2`. Let's try to retrieve the record refered to by each chain label `chain1` and `chain2` to compare the result.

```bash
$ curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 18,
  "status": 200,
  "data": {
    "provable": {
      "seed": "28dc028ddcd420cd2c3016829ac69a2b38d6756bed0a389080f74209cb308a7d",
      "id": "65825ae1a7a69f20c2a328d6aad21f23cebce92ad99c985a0e09c4c726deadd8",
      "data": "277f0da41c1523fa3b9587b22f685f02fe08317c8991621b6e1db8b7de677ecd",
      "chains": {
        "9ae931a0d4b381b9ae2ca3c5ea74b4f111fa1bfdada19c615ee4638bf7e8ce19": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "cdfb1e54ed900b392ce868debbe0f221eeb6521383e060054ab7417b8112b24c": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "2b553593fee7ea62389c75798d4e05347c0f69d2ed8dddf7d0d228e6c5c5851b",
    "hash": "0df73f226b212bf62bccd572c6e39a5b5eeca2216e0af9df6177bc8e9697002a",
    "timestamp": 1557160682439,
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "block": null
  }
}
```

```bash
$ curl -XGET "$api/chains/chain2?pretty=true"
```

```json
{
  "took": 15,
  "status": 200,
  "data": {
    "provable": {
      "seed": "28dc028ddcd420cd2c3016829ac69a2b38d6756bed0a389080f74209cb308a7d",
      "id": "65825ae1a7a69f20c2a328d6aad21f23cebce92ad99c985a0e09c4c726deadd8",
      "data": "277f0da41c1523fa3b9587b22f685f02fe08317c8991621b6e1db8b7de677ecd",
      "chains": {
        "9ae931a0d4b381b9ae2ca3c5ea74b4f111fa1bfdada19c615ee4638bf7e8ce19": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "cdfb1e54ed900b392ce868debbe0f221eeb6521383e060054ab7417b8112b24c": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "2b553593fee7ea62389c75798d4e05347c0f69d2ed8dddf7d0d228e6c5c5851b",
    "hash": "0df73f226b212bf62bccd572c6e39a5b5eeca2216e0af9df6177bc8e9697002a",
    "timestamp": 1557160682439,
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "block": null
  }
}
```

We can see that both requests return the same result.

---

To delete an entire record chain, not the blockchain itself but all records that belong to a chain you can tun the following command.

```bash
$ curl -XDELETE "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 27,
  "status": 200,
  "data": {
    "deleted": 3
  }
}
```

The response gives you the exact number of record whose data have been deleted.

```bash
# chain2 still here
$ curl -XGET "$api/chains/chain2?pretty=true"
```

```json
{
  "took": 13,
  "status": 200,
  "data": {
    "provable": {
      "seed": "28dc028ddcd420cd2c3016829ac69a2b38d6756bed0a389080f74209cb308a7d",
      "id": "65825ae1a7a69f20c2a328d6aad21f23cebce92ad99c985a0e09c4c726deadd8",
      "data": "277f0da41c1523fa3b9587b22f685f02fe08317c8991621b6e1db8b7de677ecd",
      "chains": {
        "9ae931a0d4b381b9ae2ca3c5ea74b4f111fa1bfdada19c615ee4638bf7e8ce19": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "cdfb1e54ed900b392ce868debbe0f221eeb6521383e060054ab7417b8112b24c": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "2b553593fee7ea62389c75798d4e05347c0f69d2ed8dddf7d0d228e6c5c5851b",
    "hash": "0df73f226b212bf62bccd572c6e39a5b5eeca2216e0af9df6177bc8e9697002a",
    "timestamp": 1557160682439,
    "deleted": true,
    "block": null
  }
}
```

`chain1` has been deleted as a chain label but the record that was refered to is still available (witout any data) and can be accessed using the `chain2` label. Chains label are totally independent even if they are refering to the same records.

### Block API calls

You can create a block by running:

```bash
$ curl -XPOST "$api/blocks?pretty=true&max=1"
```

```json
{
  "took": 77,
  "status": 200,
  "data": {
    "root": "7ecbdc423a3595e38d23f2840b8296c31aea086f9b346fdf53fb161476ccae60",
    "index": 2,
    "timestamp": "1557160998013",
    "count": 1,
    "previous": "71ea7073b2e9ff7bfde5b3e003fc45e8ca0cc279d6039fdf0aaf1340cfe655df"
  }
}
```

The block creation API method returns the following informations:
- `took` is the number of millisecond this request needed to be processed at server-side;
- `status` is the HTTP status code;
- `data` contains every piece of information related to the block you created;
  - `root` is the root hash of the block;
  - `index` is the block number, starting at 1;
  - `timestamp` is the record insertion time (EPOCH millisecond computed server-side);
  - `count` is the number of record contained in the block;
  - `previous` is hash of the previous block (`null` if `index` is `1`).

To create a block without any limit on the number of record that it will contain you can run the same API call without the `max` parameter.

```bash
$ curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 58,
  "status": 200,
  "data": {
    "root": "e630bddc06a7427da782d47543aeb2616299d94687873f4664b1644081c72c6c",
    "index": 3,
    "timestamp": "1557161073225",
    "count": 3,
    "previous": "7ecbdc423a3595e38d23f2840b8296c31aea086f9b346fdf53fb161476ccae60"
  }
}
```

You can run the block creation again even if you do not have sent any new records.

```bash
$ curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 36,
  "status": 200,
  "data": {
    "root": "6bd34dd6f43bec882e900fc210dea1e1fc04e1bea1101671d27b92f046b6d7f6",
    "index": 4,
    "timestamp": "1557161089454",
    "count": 0,
    "previous": "e630bddc06a7427da782d47543aeb2616299d94687873f4664b1644081c72c6c"
  }
}
```

A empty block is created.

If you want to avoid block creation with 0 record you can use the `no-empty` option.

```bash
$ curl -XPOST "$api/blocks?pretty=true&no-empty=true"
```

```json
{
  "took": 35,
  "status": 200,
  "data": null
}
```

There was no record to put in the block so the API call returned no error and did not create any new block.

---

To retrieve the last block information you can run the following:

```bash
$ curl -XGET "$api/blocks?pretty=true"
```

```json
{
  "took": 7,
  "status": 200,
  "data": {
    "root": "6bd34dd6f43bec882e900fc210dea1e1fc04e1bea1101671d27b92f046b6d7f6",
    "index": 4,
    "timestamp": "1557161089454",
    "count": 0,
    "previous": "e630bddc06a7427da782d47543aeb2616299d94687873f4664b1644081c72c6c"
  }
}
```

You can also retrieve a block by specifying its index in the path.

```bash
curl -XGET "$api/blocks/1?pretty=true"
```

```json
{
  "took": 10,
  "status": 200,
  "data": {
    "root": "71ea7073b2e9ff7bfde5b3e003fc45e8ca0cc279d6039fdf0aaf1340cfe655df",
    "index": 1,
    "timestamp": "1557160272000",
    "count": 5,
    "previous": null
  }
}
```

You can also retrieve it using its hash.

```bash
root=$(curl -sS -XGET "$api/blocks/1?" | sed -En 's/.*"root":"([^"]*).*/\1/p')
$ curl -XGET "$api/blocks/$root?pretty=true"
```

```json
{
  "took": 11,
  "status": 200,
  "data": {
    "root": "71ea7073b2e9ff7bfde5b3e003fc45e8ca0cc279d6039fdf0aaf1340cfe655df",
    "index": 1,
    "timestamp": "1557160272000",
    "count": 5,
    "previous": null
  }
}
```

## Tips

```bash
# create a block with a file
cat FILE | curl -v -XPOST -H"application/octet-stream" "http://localhost:8080/records" --data-binary @-

# redis interactive client
docker run --rm -it --network host redis redis-cli

# redis client command
docker run --rm -i --network host redis redis-cli info
docker run --rm -i --network host redis redis-cli eval "return #redis.call('keys', 'default.chain.dbserver1.*')" 0
```



## Ongoing developments

- ECMAScript 6 with unit/integration tests, code coverage, code documentation, loggers with log level
- split modules into dedicated projects?
- NPM publication
- a dedicated project precedence-proof
- Redis auto-reconnection (bad gateway error)



# Debezium example

[demo](https://github.com/inblocks/precedence-debezium/tree/poc-1/demo)
