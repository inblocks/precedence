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
  "took": 49,
  "status": 201,
  "data": {
    "provable": {
      "id": "c672a4e9bfc40c4bfdba09ec302e7c1335253f03d738937ebe6c3b58c7cc42f9",
      "seed": "b8d493e1be14b12f27540be6b643f7b90240e310edd64eae84746ae5fe8d2d80",
      "hash": "fda96a4e24fc90356d63547f5cbeb620df1cc83de33f4bd8546884e0e4e71faf",
      "address": "1428f566e6105936cce27e85d850ed734d8c7b82651566da4eeaf4608dc8ebb7",
      "signature": "d998c912838ac520074d5e73d43e9bbd894e7a0fb8055af24f6246f47697c391",
      "chains": {},
      "previous": []
    },
    "timestamp": 1577720261499,
    "seed": "5a6406a76d398204a3372a6943d87476650de8cc438ea8499df2c35cc36df1f4",
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
echo -n '5a6406a76d398204a3372a6943d87476650de8cc438ea8499df2c35cc36df1f4 5a6406a76d398204a3372a6943d87476650de8cc438ea8499df2c35cc36df1f4' | sha256sum
# -> b8d493e1be14b12f27540be6b643f7b90240e310edd64eae84746ae5fe8d2d80
```
- the obfuscated fingerprint of the hash is equal to `provable.hash` value:
```bash
echo -n "5a6406a76d398204a3372a6943d87476650de8cc438ea8499df2c35cc36df1f4 $(echo -n 'value 1' | sha256sum | cut -d' ' -f1)" | sha256sum
# -> fda96a4e24fc90356d63547f5cbeb620df1cc83de33f4bd8546884e0e4e71faf
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
  "took": 20,
  "status": 201,
  "data": {
    "provable": {
      "id": "221e9af9cc4a8213acfe09c01e5f7114a7eb5308c86acda4a28cbf5d4bd026e6",
      "seed": "e04da864b32e75d040dc69e1131b32145d687552d0b408c05cf8cb5332b1df1a",
      "hash": "ef2ad6fe87996fbebae577bce7b302537935d5f89e7d205e7aaf59767092f896",
      "address": "3b31515be6a39e439972bb7eead9a85fc52e7e8651991aa19c9fc7208fb299d8",
      "signature": "57a7c76561f4b4d4c46f94f92467f6e4b945d3e349745830c0df16b57a704065",
      "chains": {},
      "previous": []
    },
    "timestamp": 1577720355272,
    "seed": "8b8cfbac416768fc9864647d03a6c129f2a9da4edc77cca416ce4eed2ea8e3c2",
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
  "took": 16,
  "status": 201,
  "data": {
    "provable": {
      "id": "7adad27552deca42ece20adc1c99b3772734c1349463c1ab6f9aec7d5d44af4b",
      "seed": "e187da95539af2c93a6bdc0609936b2fe71a83cc68900ee1e94256cdce24cc31",
      "hash": "720b1b99488f6be449888216f8b2b734384f65f89f53ea570d750f5b38f417bf",
      "address": "659292e9fac4ce08dc64dd7bbee5431b9e407b4a5c90c482acde172cb2675e80",
      "signature": "16d8d2d583afafd88b9e1555ffbe61ae40334d9f25e0150382c91e5f81b64233",
      "chains": {},
      "previous": []
    },
    "timestamp": 1577720368278,
    "seed": "ceb790bca5e364eab305711fa03765585c4ea14eb83ae6dfd0b3963198d8c74d",
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
  "took": 15,
  "status": 201,
  "data": {
    "provable": {
      "id": "33d56a97c18e38ca0c79208485f3097ea58e84cc6098980f238eeb94e071f214",
      "seed": "9028fd93f55ef55ed28bc4bdeda79f0a9471641454a6983f48580439379ff8d9",
      "hash": "a248379a1e025c2e26268906348d51eb1933d3b6b772d58a7afd7e62d43b56bb",
      "address": "79fceac346ccb33f9e935a08b32fec0fb1334299a0966f0268e7a802ceb2eaa3",
      "signature": "366f33704dcbc267293857ba12bd8c5d6cf75f2d0efab1d18f6e18dbc0072ce7",
      "chains": {},
      "previous": []
    },
    "timestamp": 1577720379461,
    "seed": "d143d0186d02e6aeeba216045dc9c31f6a5ea00edb277a6e23d17d36ce37c025",
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
  "took": 17,
  "status": 201,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "08c380616cdbe84d56285d2a8783ccf519a0ae997489e6e37d914ef0922fbd74",
      "hash": "dbfe294e9f655e21f7205696eb8b944f92dea3202eb2c98f46dcb3cc77281c97",
      "address": "48c60c9225d911fd18dcc988b05aae7b25f5d37ce236564798ec1e625a829c2d",
      "signature": "6fd0fb182480081a82e001a9c79e87e04ddd06a8516f58a01f2914194ee3dbde",
      "chains": {},
      "previous": []
    },
    "timestamp": 1577720391853,
    "seed": "8ba9716fb0205c621b14960c1a2e51110b294c357216402f313caf7c52c19c51",
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
  "took": 11,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "08c380616cdbe84d56285d2a8783ccf519a0ae997489e6e37d914ef0922fbd74",
      "hash": "dbfe294e9f655e21f7205696eb8b944f92dea3202eb2c98f46dcb3cc77281c97",
      "address": "48c60c9225d911fd18dcc988b05aae7b25f5d37ce236564798ec1e625a829c2d",
      "signature": "6fd0fb182480081a82e001a9c79e87e04ddd06a8516f58a01f2914194ee3dbde",
      "chains": {},
      "previous": []
    },
    "timestamp": 1577720391853,
    "seed": "8ba9716fb0205c621b14960c1a2e51110b294c357216402f313caf7c52c19c51",
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
  "took": 86,
  "status": 201,
  "data": {
    "root": "67dd95107b4e561e764deb01ae297ed67e447065f0ec7560dbdeab555d83dc99",
    "index": 0,
    "timestamp": 1577720428000,
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
  "took": 19,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "08c380616cdbe84d56285d2a8783ccf519a0ae997489e6e37d914ef0922fbd74",
      "hash": "dbfe294e9f655e21f7205696eb8b944f92dea3202eb2c98f46dcb3cc77281c97",
      "address": "48c60c9225d911fd18dcc988b05aae7b25f5d37ce236564798ec1e625a829c2d",
      "signature": "6fd0fb182480081a82e001a9c79e87e04ddd06a8516f58a01f2914194ee3dbde",
      "chains": {},
      "previous": []
    },
    "timestamp": 1577720391853,
    "seed": "8ba9716fb0205c621b14960c1a2e51110b294c357216402f313caf7c52c19c51",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "chains": {},
    "data": "dmFsdWUgNQ==",
    "block": {
      "root": "67dd95107b4e561e764deb01ae297ed67e447065f0ec7560dbdeab555d83dc99",
      "proof": [
        "f8918080a0855a3f11b2dc89e3f59ec34108b1e7cd53410d2b57a0842ed0c00bf425928135a0bbc1a92a348ca32ffc159830c67179cd9efd99287231ceb948496c3e88cf1fa9808080a0278dea63527c2b7d1c49f4f6e6758384c5c4d12f5385f051c29a72cc198172a880808080a09b345d14fe65a3b8e5951e167891fa1bebb075c5845f74338a284b4e59a0267680808080",
        "f851808080a01adacbf2fe70dbd1ed13fc56eec04304caeb542c3a0769d493b904dfd155b9cf808080808080a08909229ff08c6d78c6578d558126c77b3d9190d6b324a7411edd45adb3b8199b808080808080",
        "f842a02031d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a04e35dc0823e18afeb44538400ea6e62beada0e335e6408094148e38ca99a4035"
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
  "took": 11,
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
  "took": 23,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "08c380616cdbe84d56285d2a8783ccf519a0ae997489e6e37d914ef0922fbd74",
      "hash": "dbfe294e9f655e21f7205696eb8b944f92dea3202eb2c98f46dcb3cc77281c97",
      "address": "48c60c9225d911fd18dcc988b05aae7b25f5d37ce236564798ec1e625a829c2d",
      "signature": "6fd0fb182480081a82e001a9c79e87e04ddd06a8516f58a01f2914194ee3dbde",
      "chains": {},
      "previous": []
    },
    "timestamp": 1577720391853,
    "seed": "8ba9716fb0205c621b14960c1a2e51110b294c357216402f313caf7c52c19c51",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "chains": {},
    "block": {
      "root": "67dd95107b4e561e764deb01ae297ed67e447065f0ec7560dbdeab555d83dc99",
      "proof": [
        "f8918080a0855a3f11b2dc89e3f59ec34108b1e7cd53410d2b57a0842ed0c00bf425928135a0bbc1a92a348ca32ffc159830c67179cd9efd99287231ceb948496c3e88cf1fa9808080a0278dea63527c2b7d1c49f4f6e6758384c5c4d12f5385f051c29a72cc198172a880808080a09b345d14fe65a3b8e5951e167891fa1bebb075c5845f74338a284b4e59a0267680808080",
        "f851808080a01adacbf2fe70dbd1ed13fc56eec04304caeb542c3a0769d493b904dfd155b9cf808080808080a08909229ff08c6d78c6578d558126c77b3d9190d6b324a7411edd45adb3b8199b808080808080",
        "f842a02031d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a04e35dc0823e18afeb44538400ea6e62beada0e335e6408094148e38ca99a4035"
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
  "took": 38,
  "status": 201,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "fdad1996ccf9632fb1a198c2a28865181845d2568f6b8bea7827e3b4903d02eb",
      "hash": "ccce3def280660e3fe5713fe0b7a1a6e2e18172a06c099d5d659ff37851c051e",
      "address": "6e1feebbc044d00ffd9abebf0a4d794cda2675ba609e654cec99bf2765aa2b25",
      "signature": "4b6927e2fb4f6928765d56d09608b11b8e071f0cbc02176a5cb956a94e5408c5",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "timestamp": 1577720486458,
    "seed": "c3949e31c1293bcb2eb47ded43c97848af99063a4b272caa232e2ace4ac193e8",
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
  "took": 21,
  "status": 201,
  "data": {
    "provable": {
      "id": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951",
      "seed": "0027fff37fc9d2aef9141bdb4ad4eeea531d312a832608cb855e4e9147825e85",
      "hash": "a0f150c87aaf0e2892082731c385109ce1e3a1a770a4da1dbc76dd6272aa3e41",
      "address": "e616378533e42c4b900ff0b384e1daf6ff96bce5e64e8afe9e84fdda8f1c34c0",
      "signature": "5e43ee945503851ae742c43ffbcc713a9a1074527920fa35771adf27d5c3523b",
      "chains": {
        "2ebf3f9e09fc450246fd98a4a1e08f7bb3db63be94f8cb6098626b8fbc73f0cd": null
      },
      "previous": []
    },
    "timestamp": 1577720500976,
    "seed": "4b68e995ed56df68db4ac722898659ff8bc8e1760531fcc0e2cad18f3e258a44",
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
  "took": 14,
  "status": 201,
  "data": {
    "provable": {
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "seed": "27ecfd2dc983cb30542a6fefd06cfb00822d8029c8bdd09e4e384d755ec5e889",
      "hash": "8eb78918e4d044f83cce64b16712fbeadbb4b78fb1ea6ea2ddfcb695117e578f",
      "address": "1c110178b58af05d6434feba619e004194e7192ce24ec5d1cd3ebc0d68890387",
      "signature": "34043a0fb429081c9db432aa45b8dc52632befc2d7b97e06bec3497759f91f61",
      "chains": {
        "ab5f95a93f7b1f236f001350b739bfb1c00f564b0f60b5ac5ef8edc119a2fb92": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1577720513185,
    "seed": "2bc9b60fe5fd33615b493783ef1d3bb56add2c0735fe9856ef0e406aef3a6c16",
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
echo -n "2bc9b60fe5fd33615b493783ef1d3bb56add2c0735fe9856ef0e406aef3a6c16 chain1" | sha256sum
```
- the `chains.chain1` value is equal to the `provable.chains.ab5f95a93f7b1f236f001350b739bfb1c00f564b0f60b5ac5ef8edc119a2fb92` value: `893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951`.

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
      "seed": "27ecfd2dc983cb30542a6fefd06cfb00822d8029c8bdd09e4e384d755ec5e889",
      "hash": "8eb78918e4d044f83cce64b16712fbeadbb4b78fb1ea6ea2ddfcb695117e578f",
      "address": "1c110178b58af05d6434feba619e004194e7192ce24ec5d1cd3ebc0d68890387",
      "signature": "34043a0fb429081c9db432aa45b8dc52632befc2d7b97e06bec3497759f91f61",
      "chains": {
        "ab5f95a93f7b1f236f001350b739bfb1c00f564b0f60b5ac5ef8edc119a2fb92": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1577720513185,
    "seed": "2bc9b60fe5fd33615b493783ef1d3bb56add2c0735fe9856ef0e406aef3a6c16",
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
  "took": 42,
  "status": 201,
  "data": {
    "provable": {
      "id": "669fd9cb3d5309f3b1d57eb5040f9fc8a5cc8a9154a2820fb64c0a9b53824e3e",
      "seed": "88d33c678157f4706838fdb25d4f70dfb3e53c4e8de84481a2c1684a2664048c",
      "hash": "6fa5a97264ba74de4b1f693a3f5f366486be5deca2ace8682090114ad9f26497",
      "address": "d1033c0e8ae08bd7e59616b98b882e9f8509cfea7bf701e799e05ed8414cf9dd",
      "signature": "4f8b7017375702ba271ee91d7bcb127792a7006d2070f7c4ddbafe0b891ea9e2",
      "chains": {
        "01687d2ddc071e336b354d371bfc7f6b732e38177aeea30afd7cc18a8b5e15df": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "8e9d117d4aae595f770ad81193b23c0c0557b3915ce8ffc12e15fb67c02b9d35": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1577720598023,
    "seed": "3480ff0782d91ca535a55a7c8445c86ae11d4a31778b1783e728f3f54f5baa76",
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
  "took": 24,
  "status": 200,
  "data": {
    "provable": {
      "id": "669fd9cb3d5309f3b1d57eb5040f9fc8a5cc8a9154a2820fb64c0a9b53824e3e",
      "seed": "88d33c678157f4706838fdb25d4f70dfb3e53c4e8de84481a2c1684a2664048c",
      "hash": "6fa5a97264ba74de4b1f693a3f5f366486be5deca2ace8682090114ad9f26497",
      "address": "d1033c0e8ae08bd7e59616b98b882e9f8509cfea7bf701e799e05ed8414cf9dd",
      "signature": "4f8b7017375702ba271ee91d7bcb127792a7006d2070f7c4ddbafe0b891ea9e2",
      "chains": {
        "01687d2ddc071e336b354d371bfc7f6b732e38177aeea30afd7cc18a8b5e15df": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "8e9d117d4aae595f770ad81193b23c0c0557b3915ce8ffc12e15fb67c02b9d35": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1577720598023,
    "seed": "3480ff0782d91ca535a55a7c8445c86ae11d4a31778b1783e728f3f54f5baa76",
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
  "took": 6,
  "status": 200,
  "data": {
    "provable": {
      "id": "669fd9cb3d5309f3b1d57eb5040f9fc8a5cc8a9154a2820fb64c0a9b53824e3e",
      "seed": "88d33c678157f4706838fdb25d4f70dfb3e53c4e8de84481a2c1684a2664048c",
      "hash": "6fa5a97264ba74de4b1f693a3f5f366486be5deca2ace8682090114ad9f26497",
      "address": "d1033c0e8ae08bd7e59616b98b882e9f8509cfea7bf701e799e05ed8414cf9dd",
      "signature": "4f8b7017375702ba271ee91d7bcb127792a7006d2070f7c4ddbafe0b891ea9e2",
      "chains": {
        "01687d2ddc071e336b354d371bfc7f6b732e38177aeea30afd7cc18a8b5e15df": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "8e9d117d4aae595f770ad81193b23c0c0557b3915ce8ffc12e15fb67c02b9d35": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1577720598023,
    "seed": "3480ff0782d91ca535a55a7c8445c86ae11d4a31778b1783e728f3f54f5baa76",
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
  "took": 14,
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
  "took": 11,
  "status": 200,
  "data": {
    "provable": {
      "id": "669fd9cb3d5309f3b1d57eb5040f9fc8a5cc8a9154a2820fb64c0a9b53824e3e",
      "seed": "88d33c678157f4706838fdb25d4f70dfb3e53c4e8de84481a2c1684a2664048c",
      "hash": "6fa5a97264ba74de4b1f693a3f5f366486be5deca2ace8682090114ad9f26497",
      "address": "d1033c0e8ae08bd7e59616b98b882e9f8509cfea7bf701e799e05ed8414cf9dd",
      "signature": "4f8b7017375702ba271ee91d7bcb127792a7006d2070f7c4ddbafe0b891ea9e2",
      "chains": {
        "01687d2ddc071e336b354d371bfc7f6b732e38177aeea30afd7cc18a8b5e15df": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "8e9d117d4aae595f770ad81193b23c0c0557b3915ce8ffc12e15fb67c02b9d35": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1577720598023,
    "seed": "3480ff0782d91ca535a55a7c8445c86ae11d4a31778b1783e728f3f54f5baa76",
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
  "took": 7,
  "status": 200,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "fdad1996ccf9632fb1a198c2a28865181845d2568f6b8bea7827e3b4903d02eb",
      "hash": "ccce3def280660e3fe5713fe0b7a1a6e2e18172a06c099d5d659ff37851c051e",
      "address": "6e1feebbc044d00ffd9abebf0a4d794cda2675ba609e654cec99bf2765aa2b25",
      "signature": "4b6927e2fb4f6928765d56d09608b11b8e071f0cbc02176a5cb956a94e5408c5",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "timestamp": 1577720486458,
    "seed": "c3949e31c1293bcb2eb47ded43c97848af99063a4b272caa232e2ace4ac193e8",
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
  "took": 51,
  "status": 201,
  "data": {
    "root": "2aeafe3bd211dfc26469a1f8d62a266fe57051d540953bb0e5fa54048c9da80c",
    "index": 1,
    "timestamp": 1577720790807,
    "count": 1,
    "previous": {
      "root": "67dd95107b4e561e764deb01ae297ed67e447065f0ec7560dbdeab555d83dc99",
      "proof": [
        "e217a0c29b52521f885b86548c021a737eca1fbceb25745526b45b389d4fd356fe989e",
        "f851a0e11362386708bf7159efc6b1a13f69a2ec4824101191826ec2b7e67eff6670c680808080a08f7aad3775fadcc05056e5d52593e48f18ad895c1646167bf89aeb63bfd989508080808080808080808080",
        "ea8820726576696f7573a067dd95107b4e561e764deb01ae297ed67e447065f0ec7560dbdeab555d83dc99"
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
  "took": 58,
  "status": 201,
  "data": {
    "root": "5fa86dba9ca20cc18b2c94c4924c08f8b8daa29a027f61b6573a519f351f6dd3",
    "index": 2,
    "timestamp": 1577720814740,
    "count": 3,
    "previous": {
      "root": "2aeafe3bd211dfc26469a1f8d62a266fe57051d540953bb0e5fa54048c9da80c",
      "proof": [
        "f89180808080a06fc43665b968196831d069a2fc8f1a70500bb7e2f04e11c882a1a6d9c016d68580a05120ec23bff4ba5d48f1c6a60467774e063d9ef7c0f4b2b157fb55c2638ddb65a03a014716b477b426589f878c5b1c49e78bdf25739a5614a5ef0f1cb9140bcc14a06b8178802eaabf354cdf6dc804a685c01e60e9f910661c9c7681a0fc0e70c54c8080808080808080",
        "ea8830726576696f7573a02aeafe3bd211dfc26469a1f8d62a266fe57051d540953bb0e5fa54048c9da80c"
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
    "root": "8d5efbdea49ec50f8e111974829bc7ace9a9bd5043b328289d7c25faf1452b02",
    "index": 3,
    "timestamp": 1577720831680,
    "count": 0,
    "previous": {
      "root": "5fa86dba9ca20cc18b2c94c4924c08f8b8daa29a027f61b6573a519f351f6dd3",
      "proof": [
        "eb892070726576696f7573a05fa86dba9ca20cc18b2c94c4924c08f8b8daa29a027f61b6573a519f351f6dd3"
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
  "took": 6,
  "status": 200,
  "data": {
    "count": 0,
    "previous": {
      "root": "8d5efbdea49ec50f8e111974829bc7ace9a9bd5043b328289d7c25faf1452b02",
      "index": 3,
      "timestamp": 1577720831680,
      "count": 0,
      "previous": {
        "root": "5fa86dba9ca20cc18b2c94c4924c08f8b8daa29a027f61b6573a519f351f6dd3",
        "proof": [
          "eb892070726576696f7573a05fa86dba9ca20cc18b2c94c4924c08f8b8daa29a027f61b6573a519f351f6dd3"
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
  "took": 4,
  "status": 200,
  "data": {
    "root": "2aeafe3bd211dfc26469a1f8d62a266fe57051d540953bb0e5fa54048c9da80c",
    "index": 1,
    "timestamp": 1577720790807,
    "count": 1,
    "previous": {
      "root": "67dd95107b4e561e764deb01ae297ed67e447065f0ec7560dbdeab555d83dc99",
      "proof": [
        "e217a0c29b52521f885b86548c021a737eca1fbceb25745526b45b389d4fd356fe989e",
        "f851a0e11362386708bf7159efc6b1a13f69a2ec4824101191826ec2b7e67eff6670c680808080a08f7aad3775fadcc05056e5d52593e48f18ad895c1646167bf89aeb63bfd989508080808080808080808080",
        "ea8820726576696f7573a067dd95107b4e561e764deb01ae297ed67e447065f0ec7560dbdeab555d83dc99"
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
  "took": 5,
  "status": 200,
  "data": {
    "root": "67dd95107b4e561e764deb01ae297ed67e447065f0ec7560dbdeab555d83dc99",
    "index": 0,
    "timestamp": 1577720428000,
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
