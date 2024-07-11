# VK-VIDEO-EXTRACTOR

## Installation

Using NPM:

```bash
npm install git+https://github.com/lixxteq/vk-video-extractor.git
```

Using yarn:

```bash
yarn add git+https://github.com/lixxteq/vk-video-extractor.git
```

## Usage

```js
import Extractor from 'vk-video-extractor';

const ext = new Extractor("https://vk.com/video-206819080_456239059");
// get info about video, including direct url
console.log(await ext.getVideoInfo());
// download video and return download path
console.log(await ext.download())

// download any other resource (document, audio) by direct url
await Extractor.downloadResourceByDirectUrl('https://vk.com/some_document?api=1&no_preview=1')
```
