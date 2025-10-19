const fs = require('fs');
const path = require('path');

async function main() {
  console.log('📝 Generating ABIs...\n');

  const artifacts = [
    'MONToken',
    'CMONToken',
    'CMONStaking',
    'CMONGovernance'
  ];

  const abis = {};

  for (const name of artifacts) {
    const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', `${name}.sol`, `${name}.json`);
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    abis[name] = artifact.abi;
    console.log(`✅ Generated ABI for ${name}`);
  }

  // Load deployment addresses
  const deploymentPath = path.join(__dirname, '..', 'deployments', 'monad-testnet.json');
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

  // Create contracts config
  const config = {
    MONToken: {
      address: deployment.contracts.MONToken,
      abi: abis.MONToken
    },
    CMONToken: {
      address: deployment.contracts.CMONToken,
      abi: abis.CMONToken
    },
    CMONStaking: {
      address: deployment.contracts.CMONStaking,
      abi: abis.CMONStaking
    },
    CMONGovernance: {
      address: deployment.contracts.CMONGovernance,
      abi: abis.CMONGovernance
    }
  };

  // Write to lib/contracts-config.json
  const outputPath = path.join(__dirname, '..', 'lib', 'contracts-config.json');
  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));

  console.log('\n✅ ABIs generated and saved to lib/contracts-config.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
