function setLoadingMessage(message) {
    const loadingMessage = document.getElementById('loadingMessage')
    loadingMessage.innerHTML = message
  }
  function clearLoadingMessage() {
    setLoadingMessage('')
  }
  
  function drawTable(data) {
    console.log('drawTable')
    const displayTable = document.getElementById('displayTable');
    displayTable.innerHTML=''
    var row = displayTable.insertRow(0)
    var cell
    var cell_id = 0
    var row_id = 0
    for (const elem of data) {
      if (( (cell_id) % 8) == 0) {
        row_id++;
        row = displayTable.insertRow(row_id)
        cell_id = 0
      }
      cell = row.insertCell(cell_id)
      cell.innerHTML = elem
      cell_id++
    }
  }
  
  var structured_data = []
  var locations = []
  
  function selectJob(elem,index) {
    setLoadingMessage('Finding tail...')
    var loopIndex = 0
    for (const loopElem of structured_data) {
      if (loopElem && loopElem.length > 0) {
        if (!loopElem[0].includes('[') ) {
          console.log('nav-'+loopIndex)
          var htmlElem = document.getElementById('nav-'+loopIndex)
          if (loopIndex == index) {
            htmlElem.className = 'nav-link active'
          } else {
            htmlElem.className = 'nav-link'
          }
        }
        
      }
      loopIndex++
    }
    document.getElementById('overlay').style.display = "block"
  
    
    console.log(structured_data[index])
    if (structured_data[index][0] in locations) {
      window.api.send("toMain", {
        action: "findSlurmWithLocation",
        jobId: structured_data[index][0],
        location: locations[structured_data[index][0]],
        endpoint: document.getElementById('endpoint').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
      });
    } else {
      window.api.send("toMain", {
        action: "findSlurm",
        jobId: structured_data[index][0],
        endpoint: document.getElementById('endpoint').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
      });
    }
  }
  
  function drawNav(data) {
    // <li class="nav-item"><a href="" class="nav-link active">test</a></li>
    var root_element = document.getElementById('main-nav');
    root_element.innerHTML = '';
    var index=0;
    console.log(data)
  
  
    for (const row of data) {
      //console.log ('outsiderow')
      //console.log(row)
      if (row && row.length > 0 && !row[0].includes("_")) {
        /* console.log ('insiderow')
        console.log(row) */
        var new_nav = document.createElement('li');
        new_nav.className = "nav-item";
        new_nav.innerHTML = "<a onclick=\"selectJob('nav-"+index+"',"+index+");return false;\" href='#' class='nav-link' id='nav-"+index+"' >"+row[0]+" <small>"+row[2]+"</small><br /><small style='overflow-wrap: break-word;' id='jobid-"+row[0]+"'><em>Loading...</em></small></a>";
        root_element.append(new_nav)
      }
      index++;
    }
  }
  
  //const setButton = document.getElementById('btn')
  //const titleInput = document.getElementById('title')
  document.addEventListener('DOMContentLoaded', () => {
    console.log('checking for saved creds')
    window.api.send("toMain", {
      action: 'getCreds'
    });
  })
  function login() {
    setLoadingMessage('logging in...');
    document.getElementById('overlay').style.display = "block"
    window.api.send("toMain", {
      action: 'login',
      endpoint: document.getElementById('endpoint').value,
      username: document.getElementById('username').value,
      password: document.getElementById('password').value
    });
  }
  function findSlurms() {
    setLoadingMessage('Finding slurm logs. This may take up to a minute...');
    console.log('find slurms')
    for (const elem of structured_data) {
      if (elem && elem.length > 0 && elem[0] && !elem[0].includes('[') ) {
        window.api.send("toMain", {
          action: "findLocation",
          jobId: elem[0],
          endpoint: document.getElementById('endpoint').value,
          username: document.getElementById('username').value,
          password: document.getElementById('password').value
        });
      }
    }
  }
  setInterval(findSlurms,60000)
  
  window.api.receive("fromMain", (data) => {
    drawTable(data)
  
    var array_index = 0
    
    structured_data[0] = []
    var elem_id = 0
    var job_id = 0
    console.log(data)
    for (const elem of data) {
      if (elem_id > 7) {
        
        if (( (elem_id) % 8) == 0 && elem_id >= 8) {
            array_index++;
            job_id = elem.split("_")[0]
            if (elem !== 0) {
              structured_data[job_id] = []
            }
            job_id = elem.split("_")[0]
        }
        if (elem !== 0 && elem_id >= 8) {
            structured_data[job_id].push(elem)
        }
      }
      elem_id++;
    }
    console.log('drawing')
    drawNav(structured_data)
    document.getElementById('overlay').style.display = "none"
    clearLoadingMessage()
    findSlurms()
  });
  window.api.receive("fromMainShowTail", (data) => {
    console.log('fromMainShowTail')
    var res = document.getElementById('resultDisplay')
    res.innerHTML = data
    console.log(data)
    document.getElementById('overlay').style.display = "none"
    clearLoadingMessage()
  });
  window.api.receive("sendCreds", (data) => {
    console.log('sent creds')
    console.log(data)
  });
  window.api.receive("fromMainShowLocation", (data) => {
    console.log('fromMainShowLocation')
    var location = data
    var jobId = location.substring(
      location.indexOf("slurm-") + 6, 
      location.lastIndexOf(".out")
    );
    console.log(location)
    console.log(jobId)
    document.getElementById('jobid-'+jobId).innerHTML = location
    /*for (const elem of structured_data) {
      if (elem && elem.length > 0 && elem[0] == jobId) {
        locations[jobId] = location
      }
    }
    console.log(locations)*/
    clearLoadingMessage()
  });
  
  