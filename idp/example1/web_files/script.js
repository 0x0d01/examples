const pendingList = document.getElementById('pendingList');
// const approvedList = document.getElementById('approved');
// const deniedList = document.getElementById('denied');
const loadingIndicators = document.getElementsByClassName('loading-indicator');
const socket = io('/');

socket.on('newRequest', (request) => {
  // TODO
  // Update request list
  fetchAndUpdateRequestList();
});
window.addEventListener('load', fetchAndUpdateRequestList);

let namespace, identifier, userId;

function fetchAndUpdateRequestList() {
  let args = window.location.href.split('/');
  namespace = args[args.length - 2];
  identifier = args[args.length - 1];
  if (!namespace || !identifier) window.location = '/identity';
  fetch('/getUserId/' + namespace + '/' + identifier)
    .then((response) => {
      return response.text();
    })
    .then((_userId) => {
      if(_userId === '0') {
        alert('User not found');
        window.location = '/identity';
      }
      userId = _userId.toString();
      //console.log(userId);
    });
  fetch('/requests/' + namespace + '/' + identifier)
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      //onsole.log(json);
      hideLoadingIndicators();
      updateRequestList(json);
    })
    .catch(function(error) {
      console.error(error);
    });
}

function hideLoadingIndicators() {
  Array.prototype.forEach.call(loadingIndicators, (ele) => {
    ele.style = 'display:none;';
  });
}

function clearRequestList() {
  while (pendingList.firstChild)
    pendingList.removeChild(pendingList.firstChild);
  // while (approvedList.firstChild)
  //   approvedList.removeChild(approvedList.firstChild);
  // while (deniedList.firstChild) deniedList.removeChild(deniedList.firstChild);
}

function updateRequestList(requests) {
  clearRequestList();
  requests.forEach((request) => {
    const listItem = createListItem(request);
    pendingList.appendChild(listItem);
  });

  if (pendingList.children.length === 0) {
    pendingList.appendChild(createEmptyTextListItem());
  }
  // if (approvedList.children.length === 0) {
  //   approvedList.appendChild(createEmptyTextListItem());
  // }
  // if (deniedList.children.length === 0) {
  //   deniedList.appendChild(createEmptyTextListItem());
  // }
}

function createListItem(requestObject) {
  let li = document.createElement('li');
  li.classList.add('list-group-item');
  li.classList.add('request-list-item');
  // let displayData = Object.assign({}, requestObject);
  // delete displayData.userId;

  let infoDiv = document.createElement('div');
  infoDiv.classList.add('request-info');
  infoDiv.innerHTML = `<div style="word-break: break-all;"><b>Request ID</b>: ${requestObject.request_id}</div>
    <div><b>Message</b>: ${requestObject.request_message}</div>`;

  if(requestObject.data_request_list.length !== 0) {
    let dataDiv = document.createElement('div');
    dataDiv.innerHTML = `<b>Request data</b>:<br/>`;

    for(let i in requestObject.data_request_list) {
      let dataObject = requestObject.data_request_list[i];
      let dataLi = document.createElement('li');
      dataLi.classList.add('data-list-item');
      let asList = dataObject.as_id_list[0];
      for(let i = 1 ; i < dataObject.as_id_list.length ; i++) {
        asList += ', ' + dataObject.as_id_list[i]
      }
      dataLi.innerHTML = `${dataObject.service_id} from ${dataObject.count} of ${asList}`;
      dataDiv.appendChild(dataLi);
    }
    infoDiv.appendChild(dataDiv);
  }

  li.appendChild(infoDiv);

  let buttonsDiv = document.createElement('div');
  buttonsDiv.classList.add('request-buttons');
  li.appendChild(buttonsDiv);

  if (!requestObject.processed) {
    buttonsDiv.appendChild(
      createRequestButton(
        userId,
        requestObject.request_id,
        'approve'
      )
    );
    buttonsDiv.appendChild(
      createRequestButton(
        userId,
        requestObject.request_id,
        'deny'
      )
    );
  }
  return li;
}

function createEmptyTextListItem() {
  let li = document.createElement('li');
  li.classList.add('list-group-item');

  li.textContent = 'No items';

  return li;
}

function createRequestButton(userId, requestId, action) {
  var buttonElement = document.createElement('button');
  buttonElement.type = 'button';
  buttonElement.classList.add('btn');
  buttonElement.classList.add('btn-block');
  let apiUrlPath;
  if (action === 'approve') {
    buttonElement.classList.add('btn-success');
    buttonElement.textContent = 'Approve';
    apiUrlPath = '/accept';
  } else if (action === 'deny') {
    buttonElement.classList.add('btn-danger');
    buttonElement.textContent = 'Deny';
    apiUrlPath = '/reject';
  }
  buttonElement.addEventListener('click', (event) => {
    fetch(apiUrlPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId,
        userId,
      }),
    })
    .then((response) => {
      //return response;
      //return response.json();
      //window.location.reload();
      //TODO handle when response failed (time out or close)
      fetchAndUpdateRequestList();
      if(response.status !== 200) alert('This request is manually closed or timed out.');
      return response.json();
    })
    .then((json) => {
      //console.log(json);
    });
  });
  return buttonElement;
}
