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
- proof-of-existence on every data connected
- proof-of-ownership compliant with your PKI
- automatic versioning system for every pieces of information

All these features allow you bring secure blockchain-powered traceability features to your legacy information system.

**_precedence_** is agnostic to the data type considered and can be use to bring immutable and undeniable traceability to every data that you already operate in your information system. Your system is most likely already compliant and there is no need to apply modification to it to start using **_precedence_**.

**_precedence_** is edited by [**_inBlocks_**](https://precedence.inblocks.io) so you can rely on us for hosting the solution for you, supporting you during the deployment and providing you a very strong SLA.

In the following:
- "fingerprint" means "SHA-256 hash at hexadecimal string format";
- "obfuscated fingerprint" means fingerprint of "<SEED> <VALUE>".

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
      "seed": "cb23366eb69534a35970a67e9ff4d7f4332c4d9a198765d891db536d32b035ca",
      "id": "9acd7647acbacc502ed209ccb8233126aebfd4bb1469fd8a306d389eee47a1c6",
      "data": "5a7a479ff73f301dd10f2f71153b0fe14ff2e171d1601ea0ff57fb275b789699",
      "chains": {},
      "previous": []
    },
    "seed": "2937bd4311059780ebcde82f9647d2280ba28fb2346f931466b96c59ddd9fc86",
    "hash": "29309b03a6d7332af2524f5ae33029d253cb9599832cc7db21fb7e4a5dcd538e",
    "timestamp": 1557236922817,
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
echo -n '2937bd4311059780ebcde82f9647d2280ba28fb2346f931466b96c59ddd9fc86' | sha256sum
```
- the obfuscated fingerprint of provided data is equal to `provable.data` value:
```bash
echo -n "2937bd4311059780ebcde82f9647d2280ba28fb2346f931466b96c59ddd9fc86 $(echo -n "value 1" | sha256sum | cut -f1 -d ' ')" | sha256sum
```

---

Let's create another record.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```

```json
{
  "took": 19,
  "status": 201,
  "data": {
    "provable": {
      "seed": "601da6b56ffef122acd0679e179e0f5c064088591e93425e52a9ac4c6bdb0789",
      "id": "5fc8b7e5eafd00c46a3574fd0c448c763472411cdb15dc2e2a0564ce2c81484f",
      "data": "4f45c40660caa319b60edf969ec0f26ca2906e406400b19148df5481d883c2fd",
      "chains": {},
      "previous": []
    },
    "seed": "366b7278ab5fa530450c08bba0877bbedc22d89de751306398971c53f389d92b",
    "hash": "6913f7c3d4edd72d929931b66e36b76761a06407ee6284985cdb529769f13155",
    "timestamp": 1557236970327,
    "chains": {},
    "data": "dmFsdWUgMg=="
  }
}
```

In the response you can see that the data you sent has been persisted in **_precedence_** in the `data` field using base64 encoding.

To decode the data you can run:

```bash
echo "dmFsdWUgMg==" | base64 --decode
```

---

Let's create the same data again.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true" -d "value 2"
```
```json
{
  "took": 12,
  "status": 201,
  "data": {
    "provable": {
      "seed": "46d78ef09daba18a4b8a66d697645e187574ef6f4ee80a6bdf142a4bcabb4880",
      "id": "d88bf73008c876d2679457d3eac57ef9fdf92373a838b5ed6f527916c441f4e2",
      "data": "40e2c3dab283725e7b3ee6eea45122a176a95263e4feee65bf21ac9c0f499781",
      "chains": {},
      "previous": []
    },
    "seed": "d5db4dd8edf11c4d61320565ddcdab5fb49344377548c16c715fbeebb00afcd2",
    "hash": "f4fd3fda5e6da3b54faa64016d04ed99c493e6d9e479a643a7d53cf1df73f06a",
    "timestamp": 1557236992740,
    "chains": {}
  }
}
```

All the values of the `provable` object are different from the previous ones, even with the same data value. This is made possible by using the `seed` in the hashing process. This way the `provable` fields are 100% obfuscated and can not lead to data leaking.

---

It is also possible to provide the fingerprint of the data with the `hash` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&hash=085a57ddb929d1a2853aad31940d6e718918762b8db43f299e86fe732d13d6b9" -d "value 4"
```

```json
{
  "took": 19,
  "status": 201,
  "data": {
    "provable": {
      "seed": "8ac610b320a560c51aeb6292b8a4bd009fafc8cdf45395473cb414b1d93ef8f4",
      "id": "b662ad6e141142ef95c850d4990f9ebcf0ca9a2b5b79bf8938018a17aa1b90a6",
      "data": "a4dc8daac7bbc06a43f40b3353b064dc468348ad8fa5d2056c26fb839206e1a3",
      "chains": {},
      "previous": []
    },
    "seed": "f810993cc9d39979d76b8827a4d644cdf75596e6cad5edb111c0b97f023ba20f",
    "hash": "f01cc59f0710999b7fee1762597acf68206dd3cceea821cd820f7ff32ccc293c",
    "timestamp": 1557237008427,
    "chains": {}
  }
}
```

By doing so the received data fingerprint is compared to the provided one to make sure that the received data is consistent with the sent data.

---

You can specify an identifier for your record. This identifier must be unique and so can not be used to create multiple records.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=E518B4BB-2668-4ED7-B9E3-E63803BCAC93" -d "value 5"
```

```json
{
  "took": 20,
  "status": 201,
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
  }
}
```

The returned identifier is the fingerprint of the identifier you provided.

If you try to create a new record with the same identifier you will get an error.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=E518B4BB-2668-4ED7-B9E3-E63803BCAC93" -d "value 5.1"
```

```json
{
  "took": 11,
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
  "took": 8,
  "status": 200,
  "data": {
    "provable": {
      "seed": "b3398bed0c074f5ccaee29fe557be2c5c90834316396f8955a93939f63c0e1bb",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "c41b74145fc03ef6fdb082e44af2df97aaa841d872551c44b014d34b0c2430b5",
      "chains": {},
      "previous": []
    },
    "seed": "eed74bc221acad82020ed0ca37329b8cd73a7ecd155389b222987ba0170ae356",
    "hash": "7c999a9e5217862dc8e075f0f68e8caadf210ec12aec18805c267b5e669d1d36",
    "timestamp": 1557237030800,
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
  "took": 109,
  "status": 201,
  "data": {
    "root": "3afdfa8d8e6749d407c144cfc67b1562411a25c493738772c7a01e418bbc0a2f",
    "index": 1,
    "timestamp": "1557237311683",
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
  "took": 29,
  "status": 200,
  "data": {
    "provable": {
      "seed": "b3398bed0c074f5ccaee29fe557be2c5c90834316396f8955a93939f63c0e1bb",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "c41b74145fc03ef6fdb082e44af2df97aaa841d872551c44b014d34b0c2430b5",
      "chains": {},
      "previous": []
    },
    "seed": "eed74bc221acad82020ed0ca37329b8cd73a7ecd155389b222987ba0170ae356",
    "hash": "7c999a9e5217862dc8e075f0f68e8caadf210ec12aec18805c267b5e669d1d36",
    "timestamp": 1557237030800,
    "chains": {},
    "data": "dmFsdWUgNQ==",
    "block": {
      "index": 1,
      "proof": [
        "f851808080a04c8542aa07c00cfac513287a592a798718feea12cff116f5b0c2cb9581206e6c8080a01b4cbf3f415cdeda70d2a8b40baceaef365b42f5e6285ad3967a41d05695c97e80808080808080808080",
        "f871808080a02abdb50a1c3a89c0a01062d1c087151a07be1677432d7c63bd3475793d7a04dd80a0a96fc885c67520d2c9bb96edd084eb4456941f1247fc4402e38cb4199a63e148808080a0bf4119f0b7c0e248c27407d09798ee2aaa4d11b5b4cf07187fa2e705b9ddfe9980808080808080",
        "f884b84020613331643536373437373835666166653733626336373435613164323163366238633338643134623735373366613366653330373435616465643165326334b84037633939396139653532313738363264633865303735663066363865386361616466323130656331326165633138383035633236376235653636396431643336"
      ]
    }
  }
}
```

The returned document contains information related to the block the record belongs to:
- `index` is the block number that contains this record;
- `proof` is an array that contains the agnostic proof-of-existence of this record is the block.

---

You can delete the data that is stored in the record. The record itself can not be deleted because it would cause chain inconsitency.

```bash
curl -XDELETE "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 6,
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
  "took": 23,
  "status": 200,
  "data": {
    "provable": {
      "seed": "b3398bed0c074f5ccaee29fe557be2c5c90834316396f8955a93939f63c0e1bb",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "c41b74145fc03ef6fdb082e44af2df97aaa841d872551c44b014d34b0c2430b5",
      "chains": {},
      "previous": []
    },
    "seed": "eed74bc221acad82020ed0ca37329b8cd73a7ecd155389b222987ba0170ae356",
    "hash": "7c999a9e5217862dc8e075f0f68e8caadf210ec12aec18805c267b5e669d1d36",
    "timestamp": 1557237030800,
    "deleted": true,
    "block": {
      "index": 1,
      "proof": [
        "f851808080a04c8542aa07c00cfac513287a592a798718feea12cff116f5b0c2cb9581206e6c8080a01b4cbf3f415cdeda70d2a8b40baceaef365b42f5e6285ad3967a41d05695c97e80808080808080808080",
        "f871808080a02abdb50a1c3a89c0a01062d1c087151a07be1677432d7c63bd3475793d7a04dd80a0a96fc885c67520d2c9bb96edd084eb4456941f1247fc4402e38cb4199a63e148808080a0bf4119f0b7c0e248c27407d09798ee2aaa4d11b5b4cf07187fa2e705b9ddfe9980808080808080",
        "f884b84020613331643536373437373835666166653733626336373435613164323163366238633338643134623735373366613366653330373435616465643165326334b84037633939396139653532313738363264633865303735663066363865386361616466323130656331326165633138383035633236376235653636396431643336"
      ]
    }
  }
}
```

The original `data` field has been removed and a new boolean field `deleted` has ben added. The record can still be proved to exist but the data has been removed from **_precedence_**. If you kept it somewhere then the proof is still valid.

---

To create a record as a new state of an existing record we should use the `previous` parameter. It allows you to link you records with each other.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=61E51581-7763-4486-BF04-35045DC7A0D3&previous=3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4" -d "value 6"
```

```json
{
  "took": 42,
  "status": 201,
  "data": {
    "provable": {
      "seed": "395ae1c64ceb415ec5de64c86af688a1ab179ea2cb79b3558612822eb17234ba",
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "data": "d7dc67ff6ece52421cf64bb866359b7d2d9a1bc9642dc6c3fcf821877433c34a",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "seed": "37293d4e13c9272609a6389c7d2cce8077bb2d50d2d04aa6700397527e024f68",
    "hash": "c8b24b6918bb39752f0152586fb56f214d94763c3d7491369ced0c333b38b2e4",
    "timestamp": 1557237434461,
    "chains": {}
  }
}
```

The `previous` field contains the parameter you provided. This parameter must be the identifier that was returned at creation time, you can not use your own identifier to link your records. If you want to link your record based on a label that you control, use the chain parameter (this is explain in the chain section).

---

You can delete a record data and all the data of the record specified in the previous field transitively by running the following command

```bash
curl -XDELETE "$api/records/75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6?pretty=true&previous=true"
```

```json
{
  "took": 6,
  "status": 200,
  "data": {
    "deleted": 1
  }
}
```

Only one record data was deleted because the record identified by `3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4` was already deleted.

## Chain API calls

The chain API calls have been designed to facilitate the record insertion and the creation of links (using the `previous` field) between those records.

To insert a record in the **_precedence_** system by using the chain method you need to use the `chain` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=4FF6B617-F1CF-4F10-A314-4C7733A9DB7F&chain=chain1" -d "value 7"
```

```json
{
  "took": 16,
  "status": 201,
  "data": {
    "provable": {
      "seed": "5d610c4816f178b96efa7336a19359e6d9061f9b1e631e17a25fff400d697e51",
      "id": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951",
      "data": "8d25b3ecfb21576144e5efea4613bf71e482a629814ac7ae265132826b98d775",
      "chains": {
        "3f483678ddff7924a539fbbe49f412ecd216ac5d21a6ce179cad2b7bf3609ca1": null
      },
      "previous": []
    },
    "seed": "47cb4bf459678b34a7171c843cea95c00fd05a009df25c9dda83f2c54fe73166",
    "hash": "6fde8eb6089d63ac4fa9a8eae5bdd07dfbb28da4cd8c7a64ec630247a28a84db",
    "timestamp": 1557237560829,
    "chains": {
      "chain1": null
    }
  }
}
```

The field `chains` contains information about the chain state at insertion time. In this scenario the chain `chain1` was never used before so this newly created record is the first and the last record of this chain. Because there was no record in this chain the value set in `chain.chain1` is `null`. When the chain exists, the inserted record is appended behind the last record of the chain specified in the parameter `chain`. In the same time, and in a atomic way, the newly inserted record become the last record of the chain and can be referred to using the `chain1` label.

Let's insert a second record using this `chain1` label.

```bash
curl -XPOST -H "content-type: application/octet-stream" "$api/records?pretty=true&id=2B6C83EF-474D-4A15-B1D5-A1EC7E8226CF&chain=chain1" -d "value 8"
```

```json
{
  "took": 14,
  "status": 201,
  "data": {
    "provable": {
      "seed": "6a35f4e3d8091af3d2b5fa286d379cd6397e202a4119b0555afe1719b2c69242",
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "data": "55cc44d22fa2d0bdb49357d4eb022352bf537d20e48d3cb46651149038918703",
      "chains": {
        "221b5f0be0cff6aee7dfd7ca6fba4362960b69df6391c606793e6a195f3efe46": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "ae77537dd7cb382e9b18fb26dd6a76b793ad6892f446d74543e1a29d81ff377b",
    "hash": "bfb290a0029f617aef2581127a1287dfa25ab571bb590e75097bf66c3f1426b3",
    "timestamp": 1557237682678,
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    }
  }
}
```

The field `chains` contains the key `chain1` whose value is the record identifier of the previously inserted record. The record has been appended at the end of the chain and the label `chain1` now refers to the newly inserted record. This information is provable because it is part of the record definition. The key stored in `provable.chains` has been obfuscated to avoid any data leak and for GDPR compliancy (these fields can't be removed except by deleting the entire chain).

---

It is possible to retrieve the record currently referred by a chain name.

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 9,
  "status": 200,
  "data": {
    "provable": {
      "seed": "6a35f4e3d8091af3d2b5fa286d379cd6397e202a4119b0555afe1719b2c69242",
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "data": "55cc44d22fa2d0bdb49357d4eb022352bf537d20e48d3cb46651149038918703",
      "chains": {
        "221b5f0be0cff6aee7dfd7ca6fba4362960b69df6391c606793e6a195f3efe46": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "ae77537dd7cb382e9b18fb26dd6a76b793ad6892f446d74543e1a29d81ff377b",
    "hash": "bfb290a0029f617aef2581127a1287dfa25ab571bb590e75097bf66c3f1426b3",
    "timestamp": 1557237682678,
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
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&chain=chain1&chain=chain2&previous=893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951&previous=44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3" -d "value 9"
```

```json
{
  "took": 17,
  "status": 201,
  "data": {
    "provable": {
      "seed": "4dfb5cf03372e85d4ddde10a85298b5ce83fad784c0e6d61b5de6c389f7ecd20",
      "id": "60e8c8b995dc95b79b79d91ea5b8021a2129398020e35954c9857885280c8ab7",
      "data": "48599967ce226f0e02c7e94d1c7246e0fe4a6114b438281eb48bd39e127dfd87",
      "chains": {
        "535ee4028833d39c8c384f4ac0c2ed687cba72b184553b6140c97d96933b5768": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "11b3b813c32dadd3f012d2549fac3268e8ce757f78472cb69c985fc7719c4c29": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "fa495de9115c694164a08d56793c96c439cc9f0c23d39ff63289525b02936b04",
    "hash": "a1dea5920afbbb37f573eb11932f99e53697ffed0085490d3e4f56d0c74a9971",
    "timestamp": 1557237802673,
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    }
  }
}
```

In this case the **_precedence_** server computes at insertion time and in a atomic way the previous record of this newly inserted record. It uses the chain parameters to get the list of the previous records, it merges this set to the set defined using the `previous` parameter. This atomic operation also make sure that this record is considered as the last record of the chains set in parameter.

---

The previous inserted record is the last records on both `chain1` and `chain2`. Let's try to retrieve the record refered to by each chain label `chain1` and `chain2` to compare the result.

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 10,
  "status": 200,
  "data": {
    "provable": {
      "seed": "4dfb5cf03372e85d4ddde10a85298b5ce83fad784c0e6d61b5de6c389f7ecd20",
      "id": "60e8c8b995dc95b79b79d91ea5b8021a2129398020e35954c9857885280c8ab7",
      "data": "48599967ce226f0e02c7e94d1c7246e0fe4a6114b438281eb48bd39e127dfd87",
      "chains": {
        "535ee4028833d39c8c384f4ac0c2ed687cba72b184553b6140c97d96933b5768": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "11b3b813c32dadd3f012d2549fac3268e8ce757f78472cb69c985fc7719c4c29": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "fa495de9115c694164a08d56793c96c439cc9f0c23d39ff63289525b02936b04",
    "hash": "a1dea5920afbbb37f573eb11932f99e53697ffed0085490d3e4f56d0c74a9971",
    "timestamp": 1557237802673,
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "block": null
  }
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
      "seed": "4dfb5cf03372e85d4ddde10a85298b5ce83fad784c0e6d61b5de6c389f7ecd20",
      "id": "60e8c8b995dc95b79b79d91ea5b8021a2129398020e35954c9857885280c8ab7",
      "data": "48599967ce226f0e02c7e94d1c7246e0fe4a6114b438281eb48bd39e127dfd87",
      "chains": {
        "535ee4028833d39c8c384f4ac0c2ed687cba72b184553b6140c97d96933b5768": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "11b3b813c32dadd3f012d2549fac3268e8ce757f78472cb69c985fc7719c4c29": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "fa495de9115c694164a08d56793c96c439cc9f0c23d39ff63289525b02936b04",
    "hash": "a1dea5920afbbb37f573eb11932f99e53697ffed0085490d3e4f56d0c74a9971",
    "timestamp": 1557237802673,
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
curl -XDELETE "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 22,
  "status": 200,
  "data": {
    "deleted": 3
  }
}
```

The response gives you the exact number of record whose data have been deleted.

```bash
curl -XGET "$api/chains/chain2?pretty=true"
```

```json
{
  "took": 5,
  "status": 200,
  "data": {
    "provable": {
      "seed": "4dfb5cf03372e85d4ddde10a85298b5ce83fad784c0e6d61b5de6c389f7ecd20",
      "id": "60e8c8b995dc95b79b79d91ea5b8021a2129398020e35954c9857885280c8ab7",
      "data": "48599967ce226f0e02c7e94d1c7246e0fe4a6114b438281eb48bd39e127dfd87",
      "chains": {
        "535ee4028833d39c8c384f4ac0c2ed687cba72b184553b6140c97d96933b5768": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "11b3b813c32dadd3f012d2549fac3268e8ce757f78472cb69c985fc7719c4c29": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "fa495de9115c694164a08d56793c96c439cc9f0c23d39ff63289525b02936b04",
    "hash": "a1dea5920afbbb37f573eb11932f99e53697ffed0085490d3e4f56d0c74a9971",
    "timestamp": 1557237802673,
    "deleted": true,
    "block": null
  }
}
```

`chain1` has been deleted as a chain label but the record that was refered to is still available (witout any data) and can be accessed using the `chain2` label. Chains label are totally independent even if they are refering to the same records.

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
    "root": "140a2e59ef842194521253d6e1fc05d0d51322d8cbb95c02f2e16b4d0511297b",
    "index": 2,
    "timestamp": "1557238261951",
    "count": 1,
    "previous": "3afdfa8d8e6749d407c144cfc67b1562411a25c493738772c7a01e418bbc0a2f"
  }
}
```

The block creation API method returns the following informations:
- `took` is the number of millisecond this request needed to be processed at server-side;
- `status` is the HTTP status code;
- `data` contains every piece of information related to the block you created;
  - `root` is the root hash of the block;
  - `index` is the block number, starting at 1;
  - `timestamp` is the record creation time (EPOCH millisecond);
  - `count` is the number of record contained in the block;
  - `previous` is hash of the previous block (`null` if `index` is `1`).

To create a block without any limit on the number of record that it will contain you can run the same API call without the `max` parameter.

```bash
curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 45,
  "status": 201,
  "data": {
    "root": "c10fc745288b1178b7887029e55dfe297054a94d15445f083822cf0a8d89cf16",
    "index": 3,
    "timestamp": "1557238301983",
    "count": 3,
    "previous": "140a2e59ef842194521253d6e1fc05d0d51322d8cbb95c02f2e16b4d0511297b"
  }
}
```

You can run the block creation again even if you do not have sent any new records.

```bash
curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 31,
  "status": 201,
  "data": {
    "root": "4dbfcd9a88239aa945cfd6d21c79054da16983c733af790c278e84515d25dae3",
    "index": 4,
    "timestamp": "1557238320581",
    "count": 0,
    "previous": "c10fc745288b1178b7887029e55dfe297054a94d15445f083822cf0a8d89cf16"
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
  "took": 40,
  "status": 200,
  "data": null
}
```

There was no record to put in the block so the API call returned no error and did not create any new block.

---

To retrieve the last block information you can run the following:

```bash
curl -XGET "$api/blocks?pretty=true"
```

```json
{
  "took": 3,
  "status": 200,
  "data": {
    "root": "4dbfcd9a88239aa945cfd6d21c79054da16983c733af790c278e84515d25dae3",
    "index": 4,
    "timestamp": "1557238320581",
    "count": 0,
    "previous": "c10fc745288b1178b7887029e55dfe297054a94d15445f083822cf0a8d89cf16"
  }
}
```

You can also retrieve a block by specifying its index in the path.

```bash
curl -XGET "$api/blocks/1?pretty=true"
```

```json
{
  "took": 4,
  "status": 200,
  "data": {
    "root": "3afdfa8d8e6749d407c144cfc67b1562411a25c493738772c7a01e418bbc0a2f",
    "index": 1,
    "timestamp": "1557237311683",
    "count": 5,
    "previous": null
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
    "root": "3afdfa8d8e6749d407c144cfc67b1562411a25c493738772c7a01e418bbc0a2f",
    "index": 1,
    "timestamp": "1557237311683",
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
docker run --rm -i --network host redis redis-cli eval "return #redis.call('keys', 'precedence.chain.*')" 0
```

## Ongoing developments

- ECMAScript 6 or Typescript with unit/integration tests, code coverage, code documentation, loggers with log level
- split modules into dedicated projects?
- NPM publication
- a dedicated project precedence-proof
- Redis auto-reconnection (bad gateway error)

# Debezium example

[demo](https://github.com/inblocks/precedence-debezium/tree/poc-1/demo)
