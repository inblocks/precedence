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
  "took": 23,
  "status": 201,
  "data": {
    "provable": {
      "seed": "fcfa2760a5e770eaba23b85933c4f96bb34ed49c6154fc9e3706b48a258b2a8c",
      "id": "ae221ad2662d3bd147d477b56889aa8e24cb1a930c73ba12169363e82290e7a7",
      "data": "a507ebc39c2b5155206fbfecfe8d679c351ab5450625477fb01595a718a8e3df",
      "chains": {},
      "previous": []
    },
    "seed": "db225b8dddc8b3a370921ce095a8639031c72d2f80879cdea47472b8d2a5c289",
    "hash": "53f06f9a9f25499060718cac5f24e24a2099fbbd7a66ca7525dc523a8e5f3306",
    "timestamp": 1558095499289,
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
echo -n 'db225b8dddc8b3a370921ce095a8639031c72d2f80879cdea47472b8d2a5c289' | sha256sum
```
- the obfuscated fingerprint of the data is equal to `provable.data` value:
```bash
echo -n "db225b8dddc8b3a370921ce095a8639031c72d2f80879cdea47472b8d2a5c289 $(echo -n 'value 1' | sha256sum | cut -d' ' -f1)" | sha256sum
```

---

Let's create another record with the `store=true` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```

```json
{
  "took": 15,
  "status": 201,
  "data": {
    "provable": {
      "seed": "ecef084d6f1ff9a8422b4aaaec109eed962e5694d7b86a1d7742f220196574e5",
      "id": "45c88bd4fa8686ee72a8b908f2513116d732f1e332817e52f87fa67ed47b94e5",
      "data": "a218c93b0ddd68b52ee382e454e4e7fdefd199ddd9f47094044f0d84de4fe3ce",
      "chains": {},
      "previous": []
    },
    "seed": "52129d8851c73a564aebb974c498da1dac830a0653296c1c3d72fd167e680854",
    "hash": "e43dbb828485c77eebc16e5bb017ff0ca4859bf793d9529af507c0f045952c1a",
    "timestamp": 1558095571869,
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
  "took": 14,
  "status": 201,
  "data": {
    "provable": {
      "seed": "cbcf1fd8b352ab0d3cdc87ff752258e97c3a5b7dd901aa06cad360a7981f8d48",
      "id": "891d24f41592c316ccaf2675e5cf6e4002f3d88ba20aba74f7c74ac113f64147",
      "data": "b56c1f9a90518727378d6bd94dfa910f23102f1e35ae63e9140a1992fd1c8b9f",
      "chains": {},
      "previous": []
    },
    "seed": "314611c3965f5a268f0532eeeb2ca5d9663b0ab8380bfa7d38630a6e2586a71e",
    "hash": "5d0d673518e16bc632d0f27bcd6e83f4bd5ad0a68c24a6f868d5d7f1c0149c6e",
    "timestamp": 1558095584693,
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
  "took": 13,
  "status": 201,
  "data": {
    "provable": {
      "seed": "625af28f05a8674797f91e08bd52a3a4df9439c9e04062760954eb7974fc55a2",
      "id": "71c7414200f85235c3c776d26205a0f9f9989946b3104d134445c885bccae83b",
      "data": "442de9a9ba7e1e30542a02113accb49a60bf1389304fa93d79b1e9b29bf072d3",
      "chains": {},
      "previous": []
    },
    "seed": "c9384b1468fd7b377531af607345f9783dcc9138c4e4514bf6a63de16415ac94",
    "hash": "5e6d484d1f1dcae5b551f5633a5a577aeaf1337b9963577cbff4df181a3477fc",
    "timestamp": 1558095596759,
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
  "took": 12,
  "status": 201,
  "data": {
    "provable": {
      "seed": "5e7a51ec56286ae1bcff8a225b488b6bc0a6eec3c6157c587a3a204d2732224d",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "09e18d354ed60c17eca0db7ea276495b9757c90790cbdaf0255d0159e8bf81b1",
      "chains": {},
      "previous": []
    },
    "seed": "3edff65a2b4ea21ed739daf580b1b673735545bfd298613fdf0bf099e078ae43",
    "hash": "08771d969c9cf624534302e9857f3366b2d9b22dc2b4443ee5679d2f99b82277",
    "timestamp": 1558095608866,
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
  "took": 7,
  "status": 200,
  "data": {
    "provable": {
      "seed": "5e7a51ec56286ae1bcff8a225b488b6bc0a6eec3c6157c587a3a204d2732224d",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "09e18d354ed60c17eca0db7ea276495b9757c90790cbdaf0255d0159e8bf81b1",
      "chains": {},
      "previous": []
    },
    "seed": "3edff65a2b4ea21ed739daf580b1b673735545bfd298613fdf0bf099e078ae43",
    "hash": "08771d969c9cf624534302e9857f3366b2d9b22dc2b4443ee5679d2f99b82277",
    "timestamp": 1558095608866,
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
  "took": 117,
  "status": 201,
  "data": {
    "root": "ce85a9a383b5d763efa25bb8b44bc5d4c8380578f43bf117ac3f5f311513fbd3",
    "index": 1,
    "timestamp": "1558095645856",
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
      "seed": "5e7a51ec56286ae1bcff8a225b488b6bc0a6eec3c6157c587a3a204d2732224d",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "09e18d354ed60c17eca0db7ea276495b9757c90790cbdaf0255d0159e8bf81b1",
      "chains": {},
      "previous": []
    },
    "seed": "3edff65a2b4ea21ed739daf580b1b673735545bfd298613fdf0bf099e078ae43",
    "hash": "08771d969c9cf624534302e9857f3366b2d9b22dc2b4443ee5679d2f99b82277",
    "timestamp": 1558095608866,
    "chains": {},
    "data": "dmFsdWUgNQ==",
    "block": {
      "index": 1,
      "proof": [
        "f851808080a0cdbce873a2151f35ec1eb36d4802e0781e4f4c38954015b9044ba3dc1baf074b8080a042906bfb96f9e056dabdde851882f0c2c4d64a366408d9a571b2d0c298e34a0e80808080808080808080",
        "f891808080a013621bfb6127aa31ac59ed5707d412bf8ee23b19ea367d7d16f4940bb4363580a09d77bbdbba00bec2f7e4d809e60b6be29cb93189d140108c4dcb88903d9ed09b8080a01889c43d7e33177e5f96dc4cad8e363a3751d49081c61e486b47ee03a8674488a0e29c0971f9e47839bc89b78c42c23a1ee31cc50fa0716e43e02f1c5218ecd2bd8080808080808080",
        "f884b84020613331643536373437373835666166653733626336373435613164323163366238633338643134623735373366613366653330373435616465643165326334b84030383737316439363963396366363234353334333032653938353766333336366232643962323264633262343434336565353637396432663939623832323737"
      ]
    }
  }
}
```

The returned document contains information related to the block the record belongs to:
- `index` is the block number that contains this record;
- `proof` is an array that contains the agnostic proof-of-existence of this record in the block.

To check the proof, a dedicated open-source project will be released soon. In the meantime you can do the following:
- the fingerprint of `provable` is equal to the `hash` value: `08771d969c9cf624534302e9857f3366b2d9b22dc2b4443ee5679d2f99b82277`
```bash
echo -n '{"seed":"5e7a51ec56286ae1bcff8a225b488b6bc0a6eec3c6157c587a3a204d2732224d","id":"3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4","data":"09e18d354ed60c17eca0db7ea276495b9757c90790cbdaf0255d0159e8bf81b1","chains":{},"previous":[]}' | sha256sum | cut -d' ' -f1
```
- `hash` is part of `block.proof[2]`
```bash
echo -n "08771d969c9cf624534302e9857f3366b2d9b22dc2b4443ee5679d2f99b82277" | xxd -p | tr -d '\n'
```
- `block.proof[2]` is part of `block.proof[1]`
```bash
echo -n "f884b84020613331643536373437373835666166653733626336373435613164323163366238633338643134623735373366613366653330373435616465643165326334b84030383737316439363963396366363234353334333032653938353766333336366232643962323264633262343434336565353637396432663939623832323737" | xxd -r -p | keccak-256sum | cut -d' ' -f1 | tr '[:upper:]' '[:lower:]'
```
- `block.proof[1]` is part of `block.proof[0]`
```bash
echo -n "f891808080a013621bfb6127aa31ac59ed5707d412bf8ee23b19ea367d7d16f4940bb4363580a09d77bbdbba00bec2f7e4d809e60b6be29cb93189d140108c4dcb88903d9ed09b8080a01889c43d7e33177e5f96dc4cad8e363a3751d49081c61e486b47ee03a8674488a0e29c0971f9e47839bc89b78c42c23a1ee31cc50fa0716e43e02f1c5218ecd2bd8080808080808080" | xxd -r -p | keccak-256sum | cut -d' ' -f1 | tr '[:upper:]' '[:lower:]'
```
- `block.proof[0]` is the `root` value of the block number 1 : `ce85a9a383b5d763efa25bb8b44bc5d4c8380578f43bf117ac3f5f311513fbd3`
```bash
echo -n "f851808080a0cdbce873a2151f35ec1eb36d4802e0781e4f4c38954015b9044ba3dc1baf074b8080a042906bfb96f9e056dabdde851882f0c2c4d64a366408d9a571b2d0c298e34a0e80808080808080808080" | xxd -r -p | keccak-256sum | cut -d' ' -f1 | tr '[:upper:]' '[:lower:]'
```

---

You can delete the data that is stored in the record. The record itself can not be deleted because it would cause chain inconsistency, same thing for the hash of the data, but the data itself is not required to keep the chain consistent.

```bash
curl -XDELETE "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 4,
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
  "took": 21,
  "status": 200,
  "data": {
    "provable": {
      "seed": "5e7a51ec56286ae1bcff8a225b488b6bc0a6eec3c6157c587a3a204d2732224d",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "09e18d354ed60c17eca0db7ea276495b9757c90790cbdaf0255d0159e8bf81b1",
      "chains": {},
      "previous": []
    },
    "seed": "3edff65a2b4ea21ed739daf580b1b673735545bfd298613fdf0bf099e078ae43",
    "hash": "08771d969c9cf624534302e9857f3366b2d9b22dc2b4443ee5679d2f99b82277",
    "timestamp": 1558095608866,
    "chains": {},
    "block": {
      "index": 1,
      "proof": [
        "f851808080a0cdbce873a2151f35ec1eb36d4802e0781e4f4c38954015b9044ba3dc1baf074b8080a042906bfb96f9e056dabdde851882f0c2c4d64a366408d9a571b2d0c298e34a0e80808080808080808080",
        "f891808080a013621bfb6127aa31ac59ed5707d412bf8ee23b19ea367d7d16f4940bb4363580a09d77bbdbba00bec2f7e4d809e60b6be29cb93189d140108c4dcb88903d9ed09b8080a01889c43d7e33177e5f96dc4cad8e363a3751d49081c61e486b47ee03a8674488a0e29c0971f9e47839bc89b78c42c23a1ee31cc50fa0716e43e02f1c5218ecd2bd8080808080808080",
        "f884b84020613331643536373437373835666166653733626336373435613164323163366238633338643134623735373366613366653330373435616465643165326334b84030383737316439363963396366363234353334333032653938353766333336366232643962323264633262343434336565353637396432663939623832323737"
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
  "took": 13,
  "status": 201,
  "data": {
    "provable": {
      "seed": "53f69177e32fb4b19c95e4446d7cbc038758b1a4b33f53335ac565dd617a1cb0",
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "data": "63632ee9891587be3efc6c91f5397cce61e6a22f6388c68cb913eb6f21524a71",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "seed": "080606a0e9dbeaa4da032d77d0a455b39990c1c4a22023c6fe954e7f61950be4",
    "hash": "cd78e9567a769c2c1d139760a0645fcc9dfea7a01b4b9f98f2be71f0c5d43011",
    "timestamp": 1558095852757,
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
  "took": 18,
  "status": 201,
  "data": {
    "provable": {
      "seed": "add163ed9fa5edd047cf43b22c5d60d99e34defb2843abf23e8a8650b8bbb415",
      "id": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951",
      "data": "5e7840999cb9418ececf800a9be1a232c1a8473b216b998d74d114ae44efc434",
      "chains": {
        "bd105519ef2366a3b97bcf390a247f6326180921385b29adc3215645406fdb73": null
      },
      "previous": []
    },
    "seed": "c0e3a28bba6eea7a0ce269872317b94fd77c25207f9c91abdc6de2d7d3cc063a",
    "hash": "7e9f087d320c8cb0e2fdb3c1fb6efc906a3236af69b3213b8921449eaab91e77",
    "timestamp": 155809587023,
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
  "took": 18,
  "status": 201,
  "data": {
    "provable": {
      "seed": "03f6cc9730cadaff04bfcd7421e55e83dabe003e1099c81bf6cef45e632b61cb",
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "data": "74f991fda147ea355fd645c0cd262ee55e618a4f43ad8eb4ddb57fbc70c48ef7",
      "chains": {
        "e1abb09789b1601f4b79767f0fc12233d305a2682d7fafa3090cbd85df9f235d": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "a3962b4dec2ea8b62bf8e50c6683fc389f2093bdb2fe760da6bea142d1f4f247",
    "hash": "b72671e60a801fcd8a690d2ebfc129ea35acc2dfad9fe90b4183c0cc30dc49ef",
    "timestamp": 1558095884480,
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    },
    "data": "dmFsdWUgOA=="
  }
}
```

The field `chains` contains the key `chain1` whose value is the record identifier of the previously inserted record. The record has been appended at the end of the chain and the label `chain1` now refers to the newly inserted record. This information is provable because it is part of the record definition. The key stored in `provable.chains` has been obfuscated to avoid any data leak. `chains.chain1` can be removed by deleting the entire chain.

We can check that:
- the obfuscated fingerprint of `chain1` is equal to `e1abb09789b1601f4b79767f0fc12233d305a2682d7fafa3090cbd85df9f235d`:
```bash
echo -n "a3962b4dec2ea8b62bf8e50c6683fc389f2093bdb2fe760da6bea142d1f4f247 chain1" | sha256sum
```
- the `chains.chain1` value is equal to the `provable.chains.e1abb09789b1601f4b79767f0fc12233d305a2682d7fafa3090cbd85df9f235d` value: `893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951`.

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
      "seed": "03f6cc9730cadaff04bfcd7421e55e83dabe003e1099c81bf6cef45e632b61cb",
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "data": "74f991fda147ea355fd645c0cd262ee55e618a4f43ad8eb4ddb57fbc70c48ef7",
      "chains": {
        "e1abb09789b1601f4b79767f0fc12233d305a2682d7fafa3090cbd85df9f235d": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "a3962b4dec2ea8b62bf8e50c6683fc389f2093bdb2fe760da6bea142d1f4f247",
    "hash": "b72671e60a801fcd8a690d2ebfc129ea35acc2dfad9fe90b4183c0cc30dc49ef",
    "timestamp": 1558095884480,
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
  "took": 28,
  "status": 201,
  "data": {
    "provable": {
      "seed": "93e9e0737ad7eb19a4f044ea7661f75809ba3486ddc6f79a72608166783cd538",
      "id": "810f63e415f532e5acd15182b7f6588ba80196617e9ea2c50845d05bdf708f97",
      "data": "1df49728fbfff0f79f2f69659d0ec50b845795e9b2975632138227013047fa03",
      "chains": {
        "34b9b3fe517d5e0d99b1c22040d17bbd8615235f54b16242a8676d45e7cac98b": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "f199da8d773cd5a4f5f6011ff038548e18772bd22244f1fa66003b84c327413a": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "02b4b5ec64c62a7ef63e292ec076a0ae21a34c7f612d26640fdf444ea1ec7f68",
    "hash": "80314c5f2b3517247b8747c3afab15cbe840f2f269ba058459bacfb0ead2f728",
    "timestamp": 1558095955940,
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
  "took": 5,
  "status": 200,
  "data": {
    "provable": {
      "seed": "93e9e0737ad7eb19a4f044ea7661f75809ba3486ddc6f79a72608166783cd538",
      "id": "810f63e415f532e5acd15182b7f6588ba80196617e9ea2c50845d05bdf708f97",
      "data": "1df49728fbfff0f79f2f69659d0ec50b845795e9b2975632138227013047fa03",
      "chains": {
        "34b9b3fe517d5e0d99b1c22040d17bbd8615235f54b16242a8676d45e7cac98b": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "f199da8d773cd5a4f5f6011ff038548e18772bd22244f1fa66003b84c327413a": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "02b4b5ec64c62a7ef63e292ec076a0ae21a34c7f612d26640fdf444ea1ec7f68",
    "hash": "80314c5f2b3517247b8747c3afab15cbe840f2f269ba058459bacfb0ead2f728",
    "timestamp": 1558095955940,
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
  "took": 5,
  "status": 200,
  "data": {
    "provable": {
      "seed": "93e9e0737ad7eb19a4f044ea7661f75809ba3486ddc6f79a72608166783cd538",
      "id": "810f63e415f532e5acd15182b7f6588ba80196617e9ea2c50845d05bdf708f97",
      "data": "1df49728fbfff0f79f2f69659d0ec50b845795e9b2975632138227013047fa03",
      "chains": {
        "34b9b3fe517d5e0d99b1c22040d17bbd8615235f54b16242a8676d45e7cac98b": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "f199da8d773cd5a4f5f6011ff038548e18772bd22244f1fa66003b84c327413a": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "02b4b5ec64c62a7ef63e292ec076a0ae21a34c7f612d26640fdf444ea1ec7f68",
    "hash": "80314c5f2b3517247b8747c3afab15cbe840f2f269ba058459bacfb0ead2f728",
    "timestamp": 1558095955940,
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
  "took": 9,
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
  "took": 2,
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
  "took": 4,
  "status": 200,
  "data": {
    "provable": {
      "seed": "93e9e0737ad7eb19a4f044ea7661f75809ba3486ddc6f79a72608166783cd538",
      "id": "810f63e415f532e5acd15182b7f6588ba80196617e9ea2c50845d05bdf708f97",
      "data": "1df49728fbfff0f79f2f69659d0ec50b845795e9b2975632138227013047fa03",
      "chains": {
        "34b9b3fe517d5e0d99b1c22040d17bbd8615235f54b16242a8676d45e7cac98b": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "f199da8d773cd5a4f5f6011ff038548e18772bd22244f1fa66003b84c327413a": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "02b4b5ec64c62a7ef63e292ec076a0ae21a34c7f612d26640fdf444ea1ec7f68",
    "hash": "80314c5f2b3517247b8747c3afab15cbe840f2f269ba058459bacfb0ead2f728",
    "timestamp": 1558095955940,
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
      "seed": "53f69177e32fb4b19c95e4446d7cbc038758b1a4b33f53335ac565dd617a1cb0",
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "data": "63632ee9891587be3efc6c91f5397cce61e6a22f6388c68cb913eb6f21524a71",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "seed": "080606a0e9dbeaa4da032d77d0a455b39990c1c4a22023c6fe954e7f61950be4",
    "hash": "cd78e9567a769c2c1d139760a0645fcc9dfea7a01b4b9f98f2be71f0c5d43011",
    "timestamp": 1558095852757,
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
  "took": 37,
  "status": 201,
  "data": {
    "root": "57ee675420bcf89a2eeb49287e38973457e47192d4694a0e982d01b647126147",
    "index": 2,
    "timestamp": "1558096086340",
    "count": 1,
    "previous": [
      "f851808080a0c2569b60bcf3c74312d329d2d259950626aa413cffbc48ffc1f420211a06b534808080a0f0823ce84433f2390e68280c66b1f553f5cb50031226fac71efec9b13ef94ab5808080808080808080",
      "f84b8830726576696f7573b84063653835613961333833623564373633656661323562623862343462633564346338333830353738663433626631313761633366356633313135313366626433"
    ]
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
  "took": 42,
  "status": 201,
  "data": {
    "root": "be23f3e1fabd85be3e44545cd48e41596fb6f002d8a8fa8dce539f9503aca930",
    "index": 3,
    "timestamp": "1558097626169",
    "count": 3,
    "previous": {
      "root": "57ee675420bcf89a2eeb49287e38973457e47192d4694a0e982d01b647126147",
      "proof": [
        "f851808080a01e35f1f0b429069a0b993e9da05a296c96b471362084b77e8f00dc21c2f5d579808080a05ce9e6d3d30ea2187799e29b6bbcbb2f7e47b266527802128ffab3c6c9b6d4ce808080808080808080",
        "f84b8830726576696f7573b84035376565363735343230626366383961326565623439323837653338393733343537653437313932643436393461306539383264303162363437313236313437"
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
  "took": 26,
  "status": 201,
  "data": {
    "root": "68251719fe85a17f46f67886807b83ab8254b95b9b0c949236632506018f77a2",
    "index": 4,
    "timestamp": "1558097678547",
    "count": 0,
    "previous": {
      "root": "be23f3e1fabd85be3e44545cd48e41596fb6f002d8a8fa8dce539f9503aca930",
      "proof": [
        "f84c892070726576696f7573b84062653233663365316661626438356265336534343534356364343865343135393666623666303032643861386661386463653533396639353033616361393330"
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
  "took": 18,
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
  "took": 4,
  "status": 200,
  "data": {
    "root": "68251719fe85a17f46f67886807b83ab8254b95b9b0c949236632506018f77a2",
    "index": 4,
    "timestamp": "1558097678547",
    "count": 0,
    "previous": {
      "root": "be23f3e1fabd85be3e44545cd48e41596fb6f002d8a8fa8dce539f9503aca930",
      "proof": [
        "f84c892070726576696f7573b84062653233663365316661626438356265336534343534356364343865343135393666623666303032643861386661386463653533396639353033616361393330"
      ]
    }
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
    "root": "ce85a9a383b5d763efa25bb8b44bc5d4c8380578f43bf117ac3f5f311513fbd3",
    "index": 1,
    "timestamp": "1558095645856",
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
    "root": "ce85a9a383b5d763efa25bb8b44bc5d4c8380578f43bf117ac3f5f311513fbd3",
    "index": 1,
    "timestamp": "1558095645856",
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
- `precedence-proofer` project
- Redis auto-reconnection (bad gateway error)

# Change Data Capture

**precedence** can be easily plugged to an open source project that provides a low latency data streaming platform for change data capture (CDC) named [Debezium](https://github.com/debezium/debezium). We implemented a connector compliant with both Debezium and **precedence** and we have released it in the GitHub project [inblocks/precedence-debezium](https://github.com/inblocks/precedence-debezium). You should refer to this other project documentation to know more about the way **precedence** and Debezium can be plugged to each other.

If you want to run a demo by yourself you can check [this page](https://github.com/inblocks/precedence-debezium/tree/poc-1/demo).
