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
  "took": 19,
  "status": 201,
  "data": {
    "provable": {
      "seed": "84e5d76285dc059db5f137deb153c201be297e0feec224a514700c167e72bf80",
      "id": "11ea0e7403e7d61f98c553816de52965d27423c7c1f06ddae62ca8e938a98403",
      "data": "4a2fddacf919bc64353ea8bfefb350aa2bdae0e70c96185f0f4382e17b99efcd",
      "chains": {},
      "previous": []
    },
    "seed": "910fa8789d5071fa878aa4116c843ba501251d54cc231363f5cad3a6ad1b47a1",
    "hash": "e241bd9c1c963ec1cc10696bde6ea7ccc9d63d71bc5e45c7988b2e6a24af31ed",
    "timestamp": 1557739758241,
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
echo -n '910fa8789d5071fa878aa4116c843ba501251d54cc231363f5cad3a6ad1b47a1' | sha256sum
```
- the obfuscated fingerprint of provided data is equal to `provable.data` value:
```bash
echo -n "910fa8789d5071fa878aa4116c843ba501251d54cc231363f5cad3a6ad1b47a1 $(echo -n 'value 1' | sha256sum | cut -d' ' -f1)" | sha256sum
```

---

Let's create another record.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```

```json
{
  "took": 10,
  "status": 201,
  "data": {
    "provable": {
      "seed": "e39974df1f1d296bcdf50cf7078089c075b7d9256d4068660ca4262b9169cf42",
      "id": "cd44be31d052390b0cef3f4ff24fdbc0585ee35b02f69d70e967bd9055d22964",
      "data": "95a1f34406f32dc2da77615f4f530591570a1e8e1e160f4b71e0a47d17e10472",
      "chains": {},
      "previous": []
    },
    "seed": "5446786b77d4fd1f4ff9c5cee0578c3f17b52fbb3269bb87b38ac77bc869c14d",
    "hash": "0c7fb244324216e46c98867c1a2335d7cf1dd2af9ce74971e9f1c23b069f47ff",
    "timestamp": 1557739790228,
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
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```
```json
{
  "took": 9,
  "status": 201,
  "data": {
    "provable": {
      "seed": "1cdbe2809ccc357c0fa92f0c0e265260a098ef565da571a28d11229b7162f0a2",
      "id": "5490e919038d04d6d4421351c249b3844f94016fc99582d1fee1a7df22054a96",
      "data": "a4bbb8883b5716987f244c47fd298b399fa64704a17b9da06bdfe01393617124",
      "chains": {},
      "previous": []
    },
    "seed": "76df946d0a224e76bd5ac97d063de1cdd1f0bc818b952f7eba0e30f8bc29a426",
    "hash": "d80b13d447bb0ddb752d739a3767afcca5a98075ee1031cec470c4a72872b14d",
    "timestamp": 1557739804129,
    "chains": {},
    "data": "dmFsdWUgMg=="
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
  "took": 10,
  "status": 201,
  "data": {
    "provable": {
      "seed": "5489f4c8273c6990955c7e8ff446f95fbc637697c60ba31f9375bfbbfe2b19c8",
      "id": "b61a540882f05a8390b531539430b68a4a27dc46c4917595039047255563b463",
      "data": "b878af47c87c29c9f6ef5642907f3113e381c3facc13f1ea0e2efcdbe750ae81",
      "chains": {},
      "previous": []
    },
    "seed": "6d1820b9c5f74e530e3ee599b24a17c97c66909979569890170a601c710598dc",
    "hash": "54bbdf7cf25da20e9655949f67bf6926ebe4250da4e03cb784b61bcc9a662ac6",
    "timestamp": 1557739817266,
    "chains": {}
  }
}
```

By doing so the received data fingerprint is compared to the provided one to make sure that the received data is consistent with the sent data.

---

You can specify an identifier for your record. This identifier must be unique and so can not be used to create multiple records.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true&id=E518B4BB-2668-4ED7-B9E3-E63803BCAC93" -d "value 5"
```

```json
{
  "took": 11,
  "status": 201,
  "data": {
    "provable": {
      "seed": "6078cc58516bd35e7c09e342ddf7aa711b7331f248ec991caeefc126072267a2",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "5a8261904481a3183a3bd51e09463769848c9249354d7ae21fad0ee0d93773d6",
      "chains": {},
      "previous": []
    },
    "seed": "a82d2f7a9488381d2756d10467d824eb2b5f7237e8f5cfd789efd7f3df41b9c7",
    "hash": "495486fc1d7a2f3d46107d364b454086dca2bea6a4ac8dc17767d6526bad7882",
    "timestamp": 1557739832494,
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
  "took": 8,
  "status": 409,
  "error": 3,
  "message": "Record \"3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4\" already exists",
  "data": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
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
      "seed": "6078cc58516bd35e7c09e342ddf7aa711b7331f248ec991caeefc126072267a2",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "5a8261904481a3183a3bd51e09463769848c9249354d7ae21fad0ee0d93773d6",
      "chains": {},
      "previous": []
    },
    "seed": "a82d2f7a9488381d2756d10467d824eb2b5f7237e8f5cfd789efd7f3df41b9c7",
    "hash": "495486fc1d7a2f3d46107d364b454086dca2bea6a4ac8dc17767d6526bad7882",
    "timestamp": 1557739832494,
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
  "took": 75,
  "status": 201,
  "data": {
    "root": "fc0d9bb42ac879053284e043527544582eb54845421043a285f8045835e9edf2",
    "index": 1,
    "timestamp": "1557739890940",
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
  "took": 17,
  "status": 200,
  "data": {
    "provable": {
      "seed": "6078cc58516bd35e7c09e342ddf7aa711b7331f248ec991caeefc126072267a2",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "5a8261904481a3183a3bd51e09463769848c9249354d7ae21fad0ee0d93773d6",
      "chains": {},
      "previous": []
    },
    "seed": "a82d2f7a9488381d2756d10467d824eb2b5f7237e8f5cfd789efd7f3df41b9c7",
    "hash": "495486fc1d7a2f3d46107d364b454086dca2bea6a4ac8dc17767d6526bad7882",
    "timestamp": 1557739832494,
    "chains": {},
    "data": "dmFsdWUgNQ==",
    "block": {
      "index": 1,
      "proof": [
        "f851808080a05fa17f55565a57f4f7f9e19ffb0facb0c43637a26e8b43843a0b4e8760200ac18080a04ca2674d5c5995bd09252ca03372cfb823d49e0b42578ac7887d713482f3febc80808080808080808080",
        "f87180a095da8f235adcb76716d5186a27fc613097ca0b8d393efb87713fe6f470694b0b80a0325a677abf0c208b65a2004a49a78d8094e80e75bfcf3920db1d7db31713eea980a023f364961996b982f3a9abd981b26119b01a3b4b0754f0b6393c155c7031c0828080808080808080808080",
        "f884b84020613331643536373437373835666166653733626336373435613164323163366238633338643134623735373366613366653330373435616465643165326334b84034393534383666633164376132663364343631303764333634623435343038366463613262656136613461633864633137373637643635323662616437383832"
      ]
    }
  }
}
```

The returned document contains information related to the block the record belongs to:
- `index` is the block number that contains this record;
- `proof` is an array that contains the agnostic proof-of-existence of this record in the block.

How to prove:
- the fingerprint of `provable` is equal to the `hash` value: `495486fc1d7a2f3d46107d364b454086dca2bea6a4ac8dc17767d6526bad7882`
```bash
echo -n '{"seed":"6078cc58516bd35e7c09e342ddf7aa711b7331f248ec991caeefc126072267a2","id":"3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4","data":"5a8261904481a3183a3bd51e09463769848c9249354d7ae21fad0ee0d93773d6","chains":{},"previous":[]}' | sha256sum | cut -d' ' -f1
```
- `hash` is part of `block.proof[2]`
```bash
echo -n "495486fc1d7a2f3d46107d364b454086dca2bea6a4ac8dc17767d6526bad7882" | xxd -p | tr -d '\n'
```
- `block.proof[2]` is part of `block.proof[1]`
```bash
echo -n "f884b84020613331643536373437373835666166653733626336373435613164323163366238633338643134623735373366613366653330373435616465643165326334b84034393534383666633164376132663364343631303764333634623435343038366463613262656136613461633864633137373637643635323662616437383832" | xxd -r -p | keccak-256sum | cut -d' ' -f1 | tr '[:upper:]' '[:lower:]'
```
- `block.proof[1]` is part of `block.proof[0]`
```bash
echo -n "f87180a095da8f235adcb76716d5186a27fc613097ca0b8d393efb87713fe6f470694b0b80a0325a677abf0c208b65a2004a49a78d8094e80e75bfcf3920db1d7db31713eea980a023f364961996b982f3a9abd981b26119b01a3b4b0754f0b6393c155c7031c0828080808080808080808080" | xxd -r -p | keccak-256sum | cut -d' ' -f1 | tr '[:upper:]' '[:lower:]'
```
- `block.proof[0]` is the `root` value of the block number 1 : `fc0d9bb42ac879053284e043527544582eb54845421043a285f8045835e9edf2`
```bash
echo -n "f851808080a05fa17f55565a57f4f7f9e19ffb0facb0c43637a26e8b43843a0b4e8760200ac18080a04ca2674d5c5995bd09252ca03372cfb823d49e0b42578ac7887d713482f3febc80808080808080808080" | xxd -r -p | keccak-256sum | cut -d' ' -f1 | tr '[:upper:]' '[:lower:]'
```

---

You can delete the data that is stored in the record. The record itself can not be deleted because it would cause chain inconsistency.

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
  "took": 17,
  "status": 200,
  "data": {
    "provable": {
      "seed": "6078cc58516bd35e7c09e342ddf7aa711b7331f248ec991caeefc126072267a2",
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "data": "5a8261904481a3183a3bd51e09463769848c9249354d7ae21fad0ee0d93773d6",
      "chains": {},
      "previous": []
    },
    "seed": "a82d2f7a9488381d2756d10467d824eb2b5f7237e8f5cfd789efd7f3df41b9c7",
    "hash": "495486fc1d7a2f3d46107d364b454086dca2bea6a4ac8dc17767d6526bad7882",
    "timestamp": 1557739832494,
    "chains": {},
    "block": {
      "index": 1,
      "proof": [
        "f851808080a05fa17f55565a57f4f7f9e19ffb0facb0c43637a26e8b43843a0b4e8760200ac18080a04ca2674d5c5995bd09252ca03372cfb823d49e0b42578ac7887d713482f3febc80808080808080808080",
        "f87180a095da8f235adcb76716d5186a27fc613097ca0b8d393efb87713fe6f470694b0b80a0325a677abf0c208b65a2004a49a78d8094e80e75bfcf3920db1d7db31713eea980a023f364961996b982f3a9abd981b26119b01a3b4b0754f0b6393c155c7031c0828080808080808080808080",
        "f884b84020613331643536373437373835666166653733626336373435613164323163366238633338643134623735373366613366653330373435616465643165326334b84034393534383666633164376132663364343631303764333634623435343038366463613262656136613461633864633137373637643635323662616437383832"
      ]
    }
  }
}
```

The original `data` value has been removed (GDPR compliant).

---

To create a record as a new state of an existing record we should use the `previous` parameter. It allows you to link you records with each other.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=61E51581-7763-4486-BF04-35045DC7A0D3&store=true&previous=3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4" -d "value 6"
```

```json
{
  "took": 12,
  "status": 201,
  "data": {
    "provable": {
      "seed": "9f3f00d57b698be1492c9fd37ee208e3cc2e351ce54babebbb77a2c92e457f23",
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "data": "7c6302418c02c22807340668866e006a001e69c0095d9ca63c973723d7973733",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "seed": "14c516d7e7f18b969624caf0186a5c4e9607160cfa0d979c8268e470e817dd9c",
    "hash": "03267f42f7ceb369ab1c976c0ef2e005032e1162634f484440de9fa90622b555",
    "timestamp": 1557740304324,
    "chains": {},
    "data": "dmFsdWUgNg=="
  }
}
```

The `previous` field contains the parameter you provided. This parameter must be the identifier that was returned at creation time, you can not use your own identifier to link your records. If you want to link your record based on a label that you control, use the chain parameter (this is explain in the [chain](#chain-api-calls) section).

## Chain API calls

The chain API calls have been designed to facilitate the record insertion and the creation of links (using the `previous` field) between those records.

To insert a record in the **_precedence_** system by using the chain method you need to use the `chain` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=4FF6B617-F1CF-4F10-A314-4C7733A9DB7F&chain=chain1" -d "value 7"
```

```json
{
  "took": 12,
  "status": 201,
  "data": {
    "provable": {
      "seed": "18bbdfc09e657267356f0ee4036d4fd4f006533099260e43dce54b781c52ef8c",
      "id": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951",
      "data": "ae1989f64b112e1ef1957f100d3eff2bf31b64ab3af697e6613bd15e881f2dea",
      "chains": {
        "726dba87c88e5da43a421083b2e5e7ce3538c948dede6bf2473edb16a8eebd7e": null
      },
      "previous": []
    },
    "seed": "5b9e6712e266dbf743b7d9618254f506e907f97086e506beef60a7db0113de5e",
    "hash": "32d269bc94ff3004b7e84188e4f0d24689ba83f8aab0bada8344d886da58b845",
    "timestamp": 1557740319809,
    "chains": {
      "chain1": null
    }
  }
}
```

The field `chains` contains information about the chain state at insertion time. In this scenario the chain `chain1` was never used before so this newly created record is the first and the last record of this chain. Because there was no record in this chain the value set in `chain.chain1` is `null`. When the chain exists, the inserted record is appended behind the last record of the chain specified in the parameter `chain`. In the same time, and in a atomic way, the newly inserted record become the last record of the chain and can be referred to using the `chain1` label.

Let's insert a second record using this `chain1` label.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=2B6C83EF-474D-4A15-B1D5-A1EC7E8226CF&chain=chain1&store=true" -d "value 8"
```

```json
{
  "took": 11,
  "status": 201,
  "data": {
    "provable": {
      "seed": "64ce971e6247490fc2e76c81d675aa5a0118355c5d96badee61e625a97445425",
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "data": "57ec251438705ace6503fcb03db1ace6ff3f9c9090066f86fe9c45e08094d5be",
      "chains": {
        "ac86e93bc0e055875674a46a130d86599a5a7557b069943b15cc79e22f1c714a": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "f3ef5db6b9ae13684ede7db33222a69f6b5a4fd5f25c1fdc4796263b2c873954",
    "hash": "20f6bce69d90df65877a703809bc542a07df8917d006fc5103c70b23d8e467fc",
    "timestamp": 1557740336731,
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    },
    "data": "dmFsdWUgOA=="
  }
}
```

The field `chains` contains the key `chain1` whose value is the record identifier of the previously inserted record. The record has been appended at the end of the chain and the label `chain1` now refers to the newly inserted record. This information is provable because it is part of the record definition. The key stored in `provable.chains` has been obfuscated to avoid any data leak (GDPR compliant). `chains` can be removed by deleting the entire chain.

We can check that:
- the obfuscated fingerprint of `chain1` is equal to `ac86e93bc0e055875674a46a130d86599a5a7557b069943b15cc79e22f1c714a`:
```bash
echo -n "f3ef5db6b9ae13684ede7db33222a69f6b5a4fd5f25c1fdc4796263b2c873954 chain1" | sha256sum
```
- the `chains.chain1` value is equal to the `provable.chains.ac86e93bc0e055875674a46a130d86599a5a7557b069943b15cc79e22f1c714a` value: `893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951`.

---

It is possible to retrieve the record currently referred by a chain name.

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 6,
  "status": 200,
  "data": {
    "provable": {
      "seed": "64ce971e6247490fc2e76c81d675aa5a0118355c5d96badee61e625a97445425",
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "data": "57ec251438705ace6503fcb03db1ace6ff3f9c9090066f86fe9c45e08094d5be",
      "chains": {
        "ac86e93bc0e055875674a46a130d86599a5a7557b069943b15cc79e22f1c714a": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "f3ef5db6b9ae13684ede7db33222a69f6b5a4fd5f25c1fdc4796263b2c873954",
    "hash": "20f6bce69d90df65877a703809bc542a07df8917d006fc5103c70b23d8e467fc",
    "timestamp": 1557740336731,
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    },
    "data": "dmFsdWUgOA==",
    "block": null
  }
}
```

---

You can insert a record by setting multiple chain names and the previous parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&chain=chain1&chain=chain2&previous=893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951&previous=75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6&store=true" -d "value 9"
```

```json
{
  "took": 17,
  "status": 201,
  "data": {
    "provable": {
      "seed": "5e7851adf83bff9d7df8dae63817fdd6b14248f0af674afcc1592d34833b9626",
      "id": "8737811ddbadf63084138e2709ea55ce1f1d0d4f073dcd684abb5b85d3f0303c",
      "data": "569154c733b68feb07d71e857d9c9a0c582e96456be4fa397019398b419bf59d",
      "chains": {
        "fdcb09d95628c33eaa505052031ea1edf17a2c6b60b3439bec2c4fab0a807b75": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "b3e21210fa348ee7e34de2da99efeecd01ca891c361e7464c1dd8f03c519f326": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "5332abe80b58ed195c4f9fbfe4ea981a6f4f35f3ffb1dd4d5fd864f25b07ad9f",
    "hash": "b4121b5fd2b6a9a4bce39a9bc79c35d0ead134dce7fb5673f86f7ea140e69372",
    "timestamp": 1557740415781,
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "data": "dmFsdWUgOQ=="
  }
}
```

In this case the **_precedence_** server computes at insertion time and in a atomic way the previous record of this newly inserted record. It uses the chain parameters to get the list of the previous records, it merges this set to the set defined using the `previous` parameter. This atomic operation also make sure that this record is considered as the last record of the chains set in parameter.

---

The previous inserted record is the last records on both `chain1` and `chain2`. Let's try to retrieve the record referred to by each chain label `chain1` and `chain2` to compare the result.

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 5,
  "status": 200,
  "data": {
    "provable": {
      "seed": "5e7851adf83bff9d7df8dae63817fdd6b14248f0af674afcc1592d34833b9626",
      "id": "8737811ddbadf63084138e2709ea55ce1f1d0d4f073dcd684abb5b85d3f0303c",
      "data": "569154c733b68feb07d71e857d9c9a0c582e96456be4fa397019398b419bf59d",
      "chains": {
        "fdcb09d95628c33eaa505052031ea1edf17a2c6b60b3439bec2c4fab0a807b75": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "b3e21210fa348ee7e34de2da99efeecd01ca891c361e7464c1dd8f03c519f326": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "5332abe80b58ed195c4f9fbfe4ea981a6f4f35f3ffb1dd4d5fd864f25b07ad9f",
    "hash": "b4121b5fd2b6a9a4bce39a9bc79c35d0ead134dce7fb5673f86f7ea140e69372",
    "timestamp": 1557740415781,
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
  "took": 4,
  "status": 200,
  "data": {
    "provable": {
      "seed": "5e7851adf83bff9d7df8dae63817fdd6b14248f0af674afcc1592d34833b9626",
      "id": "8737811ddbadf63084138e2709ea55ce1f1d0d4f073dcd684abb5b85d3f0303c",
      "data": "569154c733b68feb07d71e857d9c9a0c582e96456be4fa397019398b419bf59d",
      "chains": {
        "fdcb09d95628c33eaa505052031ea1edf17a2c6b60b3439bec2c4fab0a807b75": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "b3e21210fa348ee7e34de2da99efeecd01ca891c361e7464c1dd8f03c519f326": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "5332abe80b58ed195c4f9fbfe4ea981a6f4f35f3ffb1dd4d5fd864f25b07ad9f",
    "hash": "b4121b5fd2b6a9a4bce39a9bc79c35d0ead134dce7fb5673f86f7ea140e69372",
    "timestamp": 1557740415781,
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "data": "dmFsdWUgOQ==",
    "block": null
  }
}
```

We can see that both requests return the same result.

---

To delete an entire records chain, not the blockchain itself but all records that belong to a chain and the chain itself, you can run the following command:

```bash
curl -XDELETE "$api/chains/chain1?pretty=true&data=true"
```

```json
{
  "took": 8,
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
  "message": "Chain \"chain1\" not found",
  "data": "chain1"
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
      "seed": "5e7851adf83bff9d7df8dae63817fdd6b14248f0af674afcc1592d34833b9626",
      "id": "8737811ddbadf63084138e2709ea55ce1f1d0d4f073dcd684abb5b85d3f0303c",
      "data": "569154c733b68feb07d71e857d9c9a0c582e96456be4fa397019398b419bf59d",
      "chains": {
        "fdcb09d95628c33eaa505052031ea1edf17a2c6b60b3439bec2c4fab0a807b75": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "b3e21210fa348ee7e34de2da99efeecd01ca891c361e7464c1dd8f03c519f326": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "seed": "5332abe80b58ed195c4f9fbfe4ea981a6f4f35f3ffb1dd4d5fd864f25b07ad9f",
    "hash": "b4121b5fd2b6a9a4bce39a9bc79c35d0ead134dce7fb5673f86f7ea140e69372",
    "timestamp": 1557740415781,
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
      "seed": "9f3f00d57b698be1492c9fd37ee208e3cc2e351ce54babebbb77a2c92e457f23",
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "data": "7c6302418c02c22807340668866e006a001e69c0095d9ca63c973723d7973733",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "seed": "14c516d7e7f18b969624caf0186a5c4e9607160cfa0d979c8268e470e817dd9c",
    "hash": "03267f42f7ceb369ab1c976c0ef2e005032e1162634f484440de9fa90622b555",
    "timestamp": 1557740304324,
    "chains": {},
    "data": "dmFsdWUgNg==",
    "block": null
  }
}
```

`chain1` has been deleted as a chain label but the record that was referred to is still available (without any data) and can be accessed using the `chain2` label. The data of record `75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6` hasn't been deleted because this record was not part of `chain1`.

### Block API calls

You can create a block by running:

```bash
curl -XPOST "$api/blocks?pretty=true&max=1"
```

```json
{
  "took": 25,
  "status": 201,
  "data": {
    "root": "4f6527842fbe9f2bf0fdeb21be5ce47fb9ad6c52cca2af24fed8603c14a18361",
    "index": 2,
    "timestamp": "1557740559050",
    "count": 1,
    "previous": "fc0d9bb42ac879053284e043527544582eb54845421043a285f8045835e9edf2"
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
  "took": 44,
  "status": 201,
  "data": {
    "root": "b258a9f295bd6509ac7e9196d1e57ea07ff6631434021768fd8ca4f3d8a6ab39",
    "index": 3,
    "timestamp": "1557740568575",
    "count": 3,
    "previous": "4f6527842fbe9f2bf0fdeb21be5ce47fb9ad6c52cca2af24fed8603c14a18361"
  }
}
```

You can run the block creation again even if you do not have sent any new records.

```bash
curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 23,
  "status": 201,
  "data": {
    "root": "203b7abe6cd29ccc5228bf61a5d685606cb6a320523ab5328d48509eab7ac4be",
    "index": 4,
    "timestamp": "1557736791661",
    "count": 0,
    "previous": "f535911011a1871cb21663331fe684ebcea639552befc043e2a088abb7789a34"
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

To retrieve the last block information you can run the following:

```bash
curl -XGET "$api/blocks?pretty=true"
```

```json
{
  "took": 2,
  "status": 200,
  "data": {
    "root": "b258a9f295bd6509ac7e9196d1e57ea07ff6631434021768fd8ca4f3d8a6ab39",
    "index": 3,
    "timestamp": "1557740568575",
    "count": 3,
    "previous": "4f6527842fbe9f2bf0fdeb21be5ce47fb9ad6c52cca2af24fed8603c14a18361"
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
    "root": "fc0d9bb42ac879053284e043527544582eb54845421043a285f8045835e9edf2",
    "index": 1,
    "timestamp": "1557739890940",
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
    "root": "fc0d9bb42ac879053284e043527544582eb54845421043a285f8045835e9edf2",
    "index": 1,
    "timestamp": "1557739890940",
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

# Debezium example

[demo](https://github.com/inblocks/precedence-debezium/tree/poc-1/demo)
