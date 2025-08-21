/* eslint-disable @typescript-eslint/no-require-imports */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exit } = require('child_process');

const dir = path.join(__dirname, 'fetched');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const downloadAndSave = async (url, filename) => {
  try {
    const response = await axios.get(url);
    const content = response.data;

    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, content);

    console.log(`Downloaded: ${filename}`);
  } catch (error) {
    console.error(`Error downloading ${filename}:`, error);
    exit(1);
  }
};

(async () => {
  const files = [
    {
      url: 'https://raw.githubusercontent.com/BoltzExchange/boltz-client/refs/heads/master/examples/submarine/submarine.go',
      filename: 'submarine.go',
    },
    {
      url: 'https://raw.githubusercontent.com/BoltzExchange/boltz-client/refs/heads/master/examples/reverse/reverse.go',
      filename: 'reverse.go',
    },
  ];

  await Promise.all(
    files.map((file) => downloadAndSave(file.url, file.filename)),
  );
})();
