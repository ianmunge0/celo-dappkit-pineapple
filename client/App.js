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
import HelloWorldContract from './contracts/HelloWorld.json'


YellowBox.ignoreWarnings(['Warning: The provided value \'moz', 'Warning: The provided value \'ms-stream'])

export default class App extends React.Component {

  // Set the defaults for the state
  state = {
    address: '(Connect to retrieve address)',
    helloWorldContract: {},
    contractName: '',
    loanAmount: '',
    duration: '',
    referenceno: '',
    loggedin: false,
    ifTxtAmntFocused: false,
    ifTxtDaysFocused: false,
    ifTxtRefnoFocused: false,
  }

  // This function is called when the page successfully renders
  componentDidMount = async () => {
    
    // Check the Celo network ID
    const networkId = await web3.eth.net.getId();
    
    // Get the deployed HelloWorld contract info for the appropriate network ID
    const deployedNetwork = HelloWorldContract.networks[networkId];

    // Create a new contract instance with the HelloWorld contract info
    const instance = new web3.eth.Contract(
      HelloWorldContract.abi,
      deployedNetwork && deployedNetwork.address
    );

    // Save the contract instance
    this.setState({ helloWorldContract: instance })
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
    let name = await this.state.helloWorldContract.methods.getName().call()
    
    // Update state
    this.setState({ contractName: name })
  }

  write = async () => {
    const requestId = 'update_name'
    const dappName = 'Smart Loan'
    const callback = Linking.makeUrl('/my/path')

    // Create a transaction object to update the contract with the 'textInput'
    const txObject = await this.state.helloWorldContract.methods.setName(this.state.loanAmount)

    // Send a request to the Celo wallet to send an update transaction to the HelloWorld contract
    requestTxSig(
      kit,
      [
        {
          from: this.state.address,
          to: this.state.helloWorldContract.options.address,
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

  onChangeAmount = async (text) => {
    this.setState({loanAmount: text})
  }

  onChangeDuration = async (text) => {
    this.setState({duration: text})
  }

  onChangeRefno = async (text) => {
    this.setState({referenceno: text})
  }

  amtFocusChanged = async (changeParam) => {
    this.setState({ifTxtAmntFocused: changeParam})
  }

  daysFocusChanged = async (changeParam) => {
    this.setState({ifTxtDaysFocused: changeParam})
  }

  refnoFocusChanged = async (changeParam) => {
    this.setState({ifTxtRefnoFocused: changeParam})
  }

  render(){
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Smart Loan</Text>
        <Image resizeMode='contain' source={require("./assets/celologocolored.png")}></Image>
        
        {
          this.state.loggedin ? 
          <Text></Text> : 
          <View>
            <TouchableOpacity onPress={()=> this.login()} style={styles.loginbutton}>
              <Text style={styles.txtLogin}>CONNECT VALORA</Text>
            </TouchableOpacity>
          </View>
        }
        <Text style={styles.txtAccountInfo}>Account Info:</Text>
        <Text>Borrower's Address:</Text>
        <Text>{this.state.address}</Text>

        <Text></Text>

        <TextInput
          style={this.state.ifTxtAmntFocused ? styles.txtInputFocus : styles.txtInputBlur}
          onFocus={() => this.amtFocusChanged(true)}
          onBlur={() => this.amtFocusChanged(false)}
          placeholder="amount (cUSD)"
          onChangeText={text => this.onChangeAmount(text)}
          keyboardType='numeric'
          value={this.state.loanAmount}
        />
        <Text></Text>        
        <TextInput
          style={this.state.ifTxtDaysFocused ? styles.txtInputFocus : styles.txtInputBlur}
          onFocus={() => this.daysFocusChanged(true)}
          onBlur={() => this.daysFocusChanged(false)}
          placeholder="duration (days)"
          onChangeText={text => this.onChangeDuration(text)}
          keyboardType='numeric'
          value={this.state.duration}
        />
        <Text></Text>        
        <TextInput
          style={this.state.ifTxtRefnoFocused ? styles.txtInputFocus : styles.txtInputBlur}
          onFocus={() => this.refnoFocusChanged(true)}
          onBlur={() => this.refnoFocusChanged(false)}
          placeholder="reference no."
          onChangeText={text => this.onChangeRefno(text)}
          value={this.state.referenceno}
        />

        {
          this.state.loggedin ? 
          <View>
            <Text></Text>
            <TouchableOpacity onPress={() => console.log("submit function_")} style={styles.submitbutton}>
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
  },
  txtInputFocus: {
    borderColor: '#55bf7d',
    borderWidth: 2,
    backgroundColor: 'white',
    paddingHorizontal: 60, 
    borderRadius: 5
  },
  txtInputBlur: {
    borderColor: 'gray',
    borderWidth: 1,
    backgroundColor: 'white',
    paddingHorizontal: 60,
    borderRadius: 5
  }
});
