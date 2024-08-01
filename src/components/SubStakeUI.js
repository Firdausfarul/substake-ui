import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abiJson from './abi.json';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Button, TextField, Card, CardContent, Typography, Box, Grid, Container } from '@mui/material';
import { Brightness1 as CircleIcon } from '@mui/icons-material';
const cyberpunkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ff9f',
    },
    secondary: {
      main: '#ff00a0',
    },
    background: {
      default: '#0a0e17',
      paper: '#1a1e2e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
  typography: {
    fontFamily: '"Orbitron", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: '0 0 10px rgba(0, 255, 159, 0.5)',
          '&:hover': {
            boxShadow: '0 0 20px rgba(0, 255, 159, 0.8)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1e2e',
          borderRadius: 0,
          border: '1px solid #00ff9f',
          boxShadow: '0 0 15px rgba(0, 255, 159, 0.3)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#00ff9f',
            },
            '&:hover fieldset': {
              borderColor: '#00ffc8',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00ffc8',
            },
          },
        },
      },
    },
  },
});
const SubStakeABI = abiJson.abi;

const SubStakeUI = () => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [ratePerDay, setRatePerDay] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [usdcContract, setUsdcContract] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [subStakeBalance, setSubStakeBalance] = useState('0');
  const [approveAmount, setApproveAmount] = useState('');

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const contractAddress = "0x745DE4e78ff68daCE09d97258787907351f92DfC";
        const usdcAddress = "0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8";
        const subStakeContract = new ethers.Contract(contractAddress, SubStakeABI, signer);
        const usdcContractInstance = new ethers.Contract(usdcAddress, [
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)"
        ], signer);
        setContract(subStakeContract);
        setUsdcContract(usdcContractInstance);
        
        await updateBalances(address, usdcContractInstance, subStakeContract);
      } catch (error) {
        console.error("Failed to connect to wallet:", error);
        alert("Failed to connect to wallet. Check console for details.");
      }
    } else {
      console.log('Please install MetaMask!');
      alert('Please install MetaMask!');
    }
  };

  const refreshWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        if (usdcContract && contract) {
          await updateBalances(address, usdcContract, contract);
        } else {
          // If contracts are not set, re-initialize them
          await connectWallet();
        }

        console.log('Wallet refreshed');
      } catch (error) {
        console.error("Failed to refresh wallet:", error);
        alert("Failed to refresh wallet. Check console for details.");
      }
    } else {
      console.log('Please install MetaMask!');
      alert('Please install MetaMask!');
    }
  };

  const updateBalances = async (address, usdcContract, subStakeContract) => {
    const usdcBal = await usdcContract.balanceOf(address);
    setUsdcBalance(ethers.formatUnits(usdcBal, 6));
    const subStakeBal = await subStakeContract.getBalance(address);
    setSubStakeBalance(ethers.formatUnits(subStakeBal, 6));
  };

  const handleApprove = async () => {
    if (!usdcContract || !contract) return;
    try {
      const amountToApprove = ethers.parseUnits(approveAmount, 6);
      const tx = await usdcContract.approve(contract.target, amountToApprove);
      await tx.wait();
      console.log('Approved', approveAmount, 'USDC to SubStake contract');
      alert('Approved ' + approveAmount + ' USDC to SubStake contract');
      await updateBalances(account, usdcContract, contract);
    } catch (error) {
      console.error("Error in approval:", error);
      alert("Error in approval. Check console for details.");
    }
  };

  const handleDeposit = async () => {
    if (!contract) return;
    try {
      const tx = await contract.deposit(ethers.parseUnits(amount, 6));
      await tx.wait();
      console.log('Deposited', amount, 'USDC');
      alert('Deposited ' + amount + ' USDC');
      await updateBalances(account, usdcContract, contract);
    } catch (error) {
      console.error("Error in deposit:", error);
      alert("Error in deposit. Check console for details.");
    }
  };

  const handleCreateStream = async () => {
    if (!contract) return;
    try {
      const ratePerSec = ethers.parseUnits((parseFloat(ratePerDay) / 86400).toFixed(6), 6);
      const tx = await contract.createStream(recipient, ratePerSec);
      await tx.wait();
      console.log('Created stream to', recipient, 'with rate', ratePerDay, 'USDC per day');
      alert('Created stream to ' + recipient + ' with rate ' + ratePerDay + ' USDC per day');
    } catch (error) {
      console.error("Error in createStream:", error);
      alert("Error in createStream. Check console for details.");
    }
  };

  const handleWithdrawStream = async () => {
    if (!contract) return;
    try {
      const tx = await contract.withdrawStream(recipient, account);
      await tx.wait();
      console.log('Withdrawn stream from', recipient);
      alert('Withdrawn stream from ' + recipient);
      await updateBalances(account, usdcContract, contract);
    } catch (error) {
      console.error("Error in withdrawStream:", error);
      alert("Error in withdrawStream. Check console for details.");
    }
  };

  const handleCancelStream = async () => {
    if (!contract) return;
    try {
      const tx = await contract.cancelStream(recipient);
      await tx.wait();
      console.log('Cancelled stream to', recipient);
      alert('Cancelled stream to ' + recipient);
    } catch (error) {
      console.error("Error in cancelStream:", error);
      alert("Error in cancelStream. Check console for details.");
    }
  };

  const handleRugPull = async () => {
    if (!contract) return;
    try {
      const tx = await contract.rugpull();
      await tx.wait();
      console.log('Executed rugpull');
      alert('Executed rugpull');
      await updateBalances(account, usdcContract, contract);
    } catch (error) {
      console.error("Error in rugpull:", error);
      alert("Error in rugpull. Check console for details.");
    }
  };

  return (
    <ThemeProvider theme={cyberpunkTheme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ color: '#00ff9f', textShadow: '0 0 10px rgba(0, 255, 159, 0.7)' }}>
          SubStake
        </Typography>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={connectWallet} 
            sx={{ 
              minWidth: 200,
              backgroundColor: account ? '#1a1e2e' : '#00ff9f',
              color: account ? '#00ff9f' : '#0a0e17',
            }}
          >
            {account ? `Connected: ${account.slice(0,6)}...${account.slice(-4)}` : 'Connect Wallet'}
          </Button>
          <Button 
            variant="outlined" 
            onClick={refreshWallet}
            sx={{ 
              minWidth: 120,
              borderColor: '#00ff9f',
              color: '#00ff9f',
              '&:hover': {
                borderColor: '#00ffc8',
                backgroundColor: 'rgba(0, 255, 159, 0.1)',
              },
            }}
          >
            Refresh
          </Button>
        </Box>
        <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" gutterBottom align="center">
              <CircleIcon sx={{ color: '#00ff9f', mr: 1, verticalAlign: 'middle' }} />
              USDC Balance: {usdcBalance}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" gutterBottom align="center">
              <CircleIcon sx={{ color: '#ff00a0', mr: 1, verticalAlign: 'middle' }} />
              SubStake Balance: {subStakeBalance}
            </Typography>
          </Grid>
        </Grid>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Approve USDC</Typography>
                <TextField
                  type="number"
                  label="Amount to Approve"
                  value={approveAmount}
                  onChange={(e) => setApproveAmount(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <Button variant="contained" onClick={handleApprove} fullWidth>Approve USDC</Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Deposit</Typography>
                <TextField
                  type="number"
                  label="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <Button variant="contained" onClick={handleDeposit} fullWidth>Deposit</Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Create Stream</Typography>
                <TextField
                  label="Recipient Address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  type="number"
                  label="Rate (USDC per day)"
                  value={ratePerDay}
                  onChange={(e) => setRatePerDay(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <Button variant="contained" onClick={handleCreateStream} fullWidth>Create Stream</Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Withdraw Stream</Typography>
                <TextField
                  label="Sender Address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <Button variant="contained" onClick={handleWithdrawStream} fullWidth>Withdraw Stream</Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Cancel Stream</Typography>
                <TextField
                  label="Recipient Address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <Button variant="contained" onClick={handleCancelStream} fullWidth>Cancel Stream</Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleRugPull} 
            fullWidth 
            sx={{ 
              padding: 2, 
              fontSize: '1.2rem', 
              backgroundColor: '#ff00a0',
              '&:hover': {
                backgroundColor: '#ff0080',
              },
              boxShadow: '0 0 20px rgba(255, 0, 160, 0.7)',
              '&:hover': {
                boxShadow: '0 0 30px rgba(255, 0, 160, 1)',
              },
            }}
          >
            RUG PULL
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default SubStakeUI;