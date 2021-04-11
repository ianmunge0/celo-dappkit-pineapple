import React from 'react'
import './global'
import { web3, kit } from './root'
import { Image, StyleSheet, Text, TextInput, Button, View, YellowBox, TouchableOpacity } from 'react-native'
import {   
  requestTxSig,
  waitForSignedTxs,
  requestAccountAddress,
  waitForAccountAuth,
  FeeCurrency
} from '@celo/dappkit'
import { toTxResult } from "@celo/connect"
import * as Linking from 'expo-linking'
import PINE from './contracts/artifacts/PINE.json'

const contractAddress = '0x79040D6785f6806B7bcB14EBeca716E989567c43'


YellowBox.ignoreWarnings(['Warning: The provided value \'moz', 'Warning: The provided value \'ms-stream'])

export default class App extends React.Component {

  // Set the defaults for the state
  state = {
    address: 'Not logged in',
    PINE: {},
    contractName: '',
    loanAmount: '',
    duration: '',
    borrower: false,
    loggedin: false
  }

  // This function is called when the page successfully renders
  componentDidMount = async () => {
    
    // Check the Celo network ID
    const networkId = await web3.eth.net.getId();
    
    // Get the deployed HelloWorld contract info for the appropriate network ID
    const deployedNetwork = PINE.networks[networkId];

    // Create a new contract instance with the HelloWorld contract info
    const instance = new web3.eth.Contract(
      PINE.abi,
      contractAddress
    );

    // Save the contract instance
    this.setState({ PINE: instance })
  }

  login = async () => {
    
    // A string you can pass to DAppKit, that you can use to listen to the response for that request
    const requestId = 'login'
    
    // A string that will be displayed to the user, indicating the DApp requesting access/signature
    const dappName = 'Smart Loan'
    
    // The deeplink that the Celo Wallet will use to redirect the user back to the DApp with the appropriate payload.
    const callback = Linking.makeUrl('/my/path')
  
    // Ask the Celo Alfajores Wallet for user info
    requestAccountAddress({
      requestId,
      dappName,
      callback,
    })
  
    // Wait for the Celo Wallet response
    const dappkitResponse = await waitForAccountAuth(requestId)

    // Set the default account to the account returned from the wallet
    kit.defaultAccount = dappkitResponse.address

    // Get the stabel token contract
    const stableToken = await kit.contracts.getStableToken()

    // Get the user account balance (cUSD)
    const cUSDBalanceBig = await stableToken.balanceOf(kit.defaultAccount)
    
    // Convert from a big number to a string
    let cUSDBalance = cUSDBalanceBig.toString()
    
    // Update state
    this.setState({ cUSDBalance, 
                    isLoadingBalance: false,
                    address: dappkitResponse.address, 
                    phoneNumber: dappkitResponse.phoneNumber,
                    loggedin: true })
  }

  read = async () => {
    
    // Read the name stored in the HelloWorld contract
    let name = await this.state.PINE.methods.getName().call()
    
    // Update state
    this.setState({ contractName: name })
  }

  write = async () => {
    const requestId = 'update_name'
    const dappName = 'Smart Loan'
    const callback = Linking.makeUrl('/my/path')

    // Create a transaction object to update the contract with the 'textInput'
    const txObject = await this.state.PINE.methods.setName(this.state.loanAmount)

    // Send a request to the Celo wallet to send an update transaction to the HelloWorld contract
    requestTxSig(
      kit,
      [
        {
          from: this.state.address,
          to: this.state.PINE.options.address,
          tx: txObject,
          feeCurrency: FeeCurrency.cUSD
        }
      ],
      { requestId, dappName, callback }
    )

    // Get the response from the Celo wallet
    const dappkitResponse = await waitForSignedTxs(requestId)
    const tx = dappkitResponse.rawTxs[0]
    
    // Get the transaction result, once it has been included in the Celo blockchain
    let result = await toTxResult(kit.web3.eth.sendSignedTransaction(tx)).waitReceipt()

    console.log(`Hello World contract update transaction receipt: `, result)  
  }

  onChangeText = async (text) => {
    this.setState({textInput: text})
  }

  processSmartContract = () => {

    if(this.state.borrower){
      <Text>Borrower's Display</Text>
      console.log("Submit button clicked...")
      console.log(this.state.address)
      console.log("Mint the token based on ammount borrowed.")
      console.log("Transfered the token to Borrower's account.")
      console.log("Display BalanceOf token.")
    } else {
      <Text>Lender's Display</Text>
      console.log("Submit button clicked...")
      console.log(this.state.address)
      console.log("Call the buyToken function in contract.")
      console.log("Transfered celo to Borrower's account.")
      console.log("Display BalanceOf token received by lender.")
    }
  }

  loginBorrow = () => {
    this.login()
    console.log("Login as borrower...")
    this.setState({ borrower: true })
  }

  loginInvest = () => {
    this.login()
    console.log("Login as investor...")
  }

  render(){
    return (
      <View style={styles.container}>
        
        <Text style={styles.title}>Smart Loan</Text>
        <Image resizeMode='contain' source={require("./assets/celologocolored.png")}></Image>
        
        <Text style={styles.txtAccountInfo}>Account Info:</Text>
        
        <Text>User's Address:</Text>

        <Text>{this.state.address}</Text>

        {
          this.state.loggedin ? 
          <Text></Text> : 
          <View>
            <TouchableOpacity onPress={()=> this.loginBorrow()} style={styles.loginbutton}>
              <Text style={styles.txtLogin}>BORROW</Text>
            </TouchableOpacity>
            <Text></Text> 
            <TouchableOpacity onPress={()=> this.loginInvest()} style={styles.loginbutton}>
              <Text style={styles.txtLogin}>INVEST</Text>
            </TouchableOpacity>
          </View>
        }

        {
          this.state.loggedin ? 
          <View>
            <Text></Text>
            <TextInput
              style={{  borderColor: 'gray', borderWidth: 1, backgroundColor: 'white', paddingHorizontal: 60, borderRadius: 5 }}
              placeholder="amount (CELO)"
              onChangeText={(text) => 
                this.setState({text})
              }
              /*value={this.state.loanAmount}*/
            />
            <Text></Text>        
            
            {
              this.state.borrower ? 
                <TextInput
                  style={{  borderColor: 'gray', borderWidth: 1, backgroundColor: 'white', paddingHorizontal: 60, borderRadius: 5 }}
                  placeholder="duration (days)"
                  onChangeText={(text) => this.onChangeText(text)}
                  /*value={this.state.duration}*/
                />
                : 
                <TextInput
                  style={{  borderColor: 'gray', borderWidth: 1, backgroundColor: 'white', paddingHorizontal: 60, borderRadius: 5 }}
                  placeholder="Borrower's Contract Adds"
                  onChangeText={(text) => this.onChangeText(text)}
                  /*value={this.state.duration}*/
                />
            }

          </View>
          : <Text></Text>
        }


        {
          this.state.loggedin ? 
          <View>
            <Text></Text>
            <TouchableOpacity 
            onPress={() => this.processSmartContract()} 
            style={styles.submitbutton}>
              <Text style={styles.txtSubmit}>SUBMIT</Text>
            </TouchableOpacity>
          </View> : 
          <Text></Text>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold'
  },
  txtLogin: {
    color: 'white',
    fontSize: 13
  },
  loginbutton: {
    backgroundColor: "#fcc16b",
    borderRadius: 5,
    paddingHorizontal: 60,
    paddingVertical: 10
  },
  txtAccountInfo: {
    marginVertical: 8, 
    fontSize: 17, 
    fontWeight: 'bold'
  },
  txtSubmit: {
    color: 'white',
    fontSize: 13
  },
  submitbutton: {
    backgroundColor: "#55bf7d",
    borderRadius: 5,
    paddingHorizontal: 60,
    paddingVertical: 10
  }
});
