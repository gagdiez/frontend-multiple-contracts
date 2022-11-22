import 'regenerator-runtime/runtime';
import { utils } from 'near-api-js'
import { Wallet } from './near-wallet';

const HELLO_ADDRESS = "hello.near-examples.testnet";
const GUEST_ADDRESS = "guestbook.near-examples.testnet";

const wallet = new Wallet({})
const THIRTY_TGAS = '30000000000000';
const NO_DEPOSIT = '0';

// Setup on page load
window.onload = async () => {
  let isSignedIn = await wallet.startUp();

  if (isSignedIn) {
    signedInFlow();
  } else {
    signedOutFlow();
  }

  getGreetingAndMessages();
};

// Button clicks
document.querySelector('form').onsubmit = sendGreeting;
document.querySelector('#sign-in-button').onclick = () => { wallet.signIn(); };
document.querySelector('#sign-out-button').onclick = () => { wallet.signOut(); };

async function sendGreeting(event) {
  // handle UI
  event.preventDefault();
  const { greeting, premium_check } = event.target.elements;

  document.querySelector('#signed-in-flow').classList.add('please-wait');

  const GUEST_DEPOSIT = premium_check.checked ? utils.format.parseNearAmount('0.1') : '0';

  const guestTx = {
    receiverId: GUEST_ADDRESS,
    actions: [
      // You can batch actions against a contract: If any fails, they ALL get reverted 
      {
        type: 'FunctionCall',
        params: { methodName: 'add_message', args: { text: greeting.value }, gas: THIRTY_TGAS, deposit: GUEST_DEPOSIT }
      }
    ]
  }

  const helloTx = {
    receiverId: HELLO_ADDRESS,
    actions: [
      // You can batch actions against a contract: If any fails, they ALL get reverted 
      {
        type: 'FunctionCall',
        params: { methodName: 'set_greeting', args: { greeting: greeting.value }, gas: THIRTY_TGAS, deposit: NO_DEPOSIT }
      }
    ]
  }

  // Ask the user to sign the **independent** transactions
  //   If one fails, the rest are **NOT** reverted
  await wallet.signAndSendTransactions({ transactions: [ helloTx, guestTx ] })
}

async function getGreetingAndMessages() {
  // query the greeting in Hello NEAR
  const currentGreeting = await wallet.viewMethod({ method: 'get_greeting', contractId: HELLO_ADDRESS });

  // query the last 4 messages in the Guest Book
  const totalMessages = await wallet.viewMethod({method: 'total_messages', contractId: GUEST_ADDRESS })
  const from_index = (totalMessages > 4? totalMessages - 4: 0).toString();
  const latestMessages = await wallet.viewMethod({ method: 'get_messages', contractId: GUEST_ADDRESS, args: {from_index, limit: 4} });

  // handle UI stuff
  update_UI(currentGreeting, from_index, latestMessages);
}

// UI: Display the signed-out-flow container
function signedOutFlow() {
  document.querySelector('#signed-in-flow').style.display = 'none';
  document.querySelector('#signed-out-flow').style.display = 'block';
}

// UI: Displaying the signed in flow container and fill in account-specific data
function signedInFlow() {
  document.querySelector('#signed-out-flow').style.display = 'none';
  document.querySelector('#signed-in-flow').style.display = 'block';
  document.querySelectorAll('[data-behavior=account-id]').forEach(el => {
    el.innerText = wallet.accountId;
  });
}

function update_UI(greeting, from, messages) {
  document.querySelector('#greeting').innerHTML = greeting;

  const list = document.querySelector('#message-list')
  list.innerHTML = "";

  let idx = from;
  messages.forEach(msg => {
    let item = document.createElement('tr')
    const innerHTML = `
      <tr>
       <th scope="row">${idx++}</th>
       <td> ${msg.sender} </td>
       <td> ${msg.text} </td>
       <td> ${msg.premium}</td>
      </tr>
    `
    item.innerHTML = innerHTML
    list.appendChild(item)
  })
}