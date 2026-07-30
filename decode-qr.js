const fs = require('fs');
const jsQR = require('jsqr');
const jpeg = require('jpeg-js');

function decodeQR(filePath) {
  try {
    const jpegData = fs.readFileSync(filePath);
    const rawImageData = jpeg.decode(jpegData, {useTArray: true});
    const code = jsQR(rawImageData.data, rawImageData.width, rawImageData.height);
    if (code) {
      console.log("Found QR code data:", code.data);
    } else {
      console.log("Could not find QR code in image.");
    }
  } catch (err) {
    console.error("Error reading image:", err);
  }
}

decodeQR('payment qr.jpeg');
