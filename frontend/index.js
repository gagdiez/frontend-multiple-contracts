import 'regenerator-runtime/runtime';
import { utils } from 'near-api-js'
import { Wallet } from './near-wallet';

const HELLO_ADDRESS = "hello.near-examples.testnet";
const GUEST_ADDRESS = "guestbook.near-examples.testnet";

const wallet = new Wallet({})

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
  console.log(event.target.elements)

  const deposit = premium_check.checked ? utils.format.parseNearAmount('0.1') : '0';

  await wallet.batchMethodCalls(
    [
      {
        contractId: HELLO_ADDRESS,
        method_calls: [
          { method: 'set_greeting', args: { greeting: greeting.value } },
          // { method: 'get_greeting', args: { } },
        ]
      },
      {
        contractId: GUEST_ADDRESS,
        method_calls: [
          { method: 'add_message', args: { text: greeting.value }, deposit }
        ]
      }
    ]
  )

}

async function getGreetingAndMessages() {
  // use the wallet to query both Smart Contracts
  const currentGreeting = await wallet.viewMethod({ method: 'get_greeting', contractId: HELLO_ADDRESS });
  const latestMessages = await wallet.viewMethod({ method: 'get_messages', contractId: GUEST_ADDRESS });

  // handle UI stuff
  update_UI(currentGreeting, latestMessages);
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

function update_UI(greeting, messages) {
  document.querySelector('#greeting').innerHTML = greeting;

  const list = document.querySelector('#message-list')
  list.innerHTML = "";

  let idx = 1;
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