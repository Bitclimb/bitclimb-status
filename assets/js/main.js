$(() => {
  function renderChart (cont, series, avg) {
    Highcharts.chart(cont, {
      credits:{enabled: false},
      title: {
        text: `Response Time last 24 hours (${avg}ms avg.)`
      },
      legend: {
        align: 'left',
        verticalAlign: 'top',
        x: 100,
        y: 50,
        borderRadius: 5,
        borderWidth: 1,
        floating: true
      },
      yAxis: {
        title: {
          text: 'Response time(ms)'
        }
      },
      xAxis: {
        type: 'datetime'
      },
      series

    });
  }

  function renderAvgChart (cont, series, name) {
    Highcharts.chart(cont, {
      credits:{enabled: false},
      chart: {
        type: 'bar'
      },
      legend: { enabled: false },
      title: {
        text: 'Uptime'
      },
      plotOptions: {
        series: {
          shadow: false,
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            formatter () {
              return `${Highcharts.numberFormat(this.y)}%`;
            }
          }
        }
      },
      yAxis: {
        ceiling: 100,
        labels: {
          formatter () {
            return `${Highcharts.numberFormat(this.value, 0, ',')}%`;
          }
        },
        title: {
          text: null
        }
      },
      xAxis: {
        categories: ['24 hours', '7 days', '30 days'],
        title: {
          text: null
        }
      },
      series: [{ data: series.map(x => Number.parseFloat(x)), name }]

    });
  }

  function addService (obj, series) {
    $('ul.services').append(`<li id="li-${obj.name.toLowerCase()}">${obj.name.replace('_', ' ')}
      <span class="tooltip" data-tip="Access to ${obj.url}">?</span>
      <span class="status ${obj.statusclass}">${obj.status}</span>
      </li>`);
    $('#modals').append(`
        <div id="${obj.name.toLowerCase()}" class="modal">
          <div class="modal-content">
            <span class="close">&times;</span>
            <div class="container-fluid">
              <div class="row">
                <div class="column">
                  <div class="row">
                    <div id="chart-avg-${obj.name.toLowerCase()}" style="width:100%; height:200px;"></div>
                  </div>
                  <div class="row">
                  <div id="chart-${obj.name.toLowerCase()}" style="width:100%; height:300px;"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);
    renderChart(`chart-${obj.name.toLowerCase()}`, series, obj.avg);
    renderAvgChart(`chart-avg-${obj.name.toLowerCase()}`, obj.uptime, obj.name.replace('_', ' '));
    $(`#li-${obj.name.toLowerCase()}`).on('click', () => {   
      const m = $(`#${obj.name.toLowerCase()}`);
      m.css('display', 'block');
      m.find('.close').one('click', () => {
        m.css('display', 'none');
      });
    });
  }

  function addIssues (obj) {
    $('ul.issues').append(`<li>
      <div class="txt-bold issues-date">${obj.created}</div>
      <div class="issues-title">[${obj.label[0].name}] ${obj.title}</div>
      <div class="issues-body"><span class="txt-bold">Details: </span>${obj.body}</div>
      <div class="issues-body"><span class="txt-bold">Status: </span><span class="label-${obj.state}">${obj.state}</span></div>
      </li>`);
  }

  function requestStats () {
    $.get('https://runkit.io/uniibu/bitclimb-status/1.0.2', data => {
      localStorage.removeItem('status');
      localStorage.setItem('lastupdate', Date.now());
      localStorage.setItem('status', JSON.stringify(data));
      statsParse(data);
    });
  }

  function requestIssues () {
    $.get('https://api.github.com/repos/Bitclimb/bitclimb-status/issues?state=all', data => {
      data = data.slice(0, 10);
      localStorage.removeItem('issues');
      localStorage.setItem('lastupdate', Date.now());
      localStorage.setItem('issues', JSON.stringify(data));
      issuesParse(data);
    });
  }

  function issuesParse (data) {
    $('.cat-titles-issues').show();
    $('.updatetime-issues').text(`Updated ${moment(parseInt(localStorage.getItem('lastupdate'))).fromNow()}`);
    for (const v of Object.values(data)) {
      if(v.labels.length > 0){
        const obj = {
          label: v.labels,
          title: v.title,
          body: v.body,
          state: v.state,
          created: moment(v.created_at).format('MMM D, YYYY')
        };
        addIssues(obj);
      }
    }
  }

  function statsParse (data) {
    $('.loader').hide();
    $('.cat-titles-services').show();
    $('.updatetime-services').text(`Updated ${moment(parseInt(localStorage.getItem('lastupdate'))).fromNow()}`);
    for (const v of Object.values(data)) {
      const obj = {};
      obj.name = v.name;
      obj.data = v.response_history.map(x => [x.datetime * 1000, x.value]).reverse();
      addService({ name: v.name, url: v.url, status: v.status, statusclass: v.status.split(' ').shift().toLowerCase(), avg: v.response_avg, uptime: v.uptime }, [obj]);
    }
  }

  function getStats () {
    const cachedata = JSON.parse(localStorage.getItem('status'));
    const lastupd = parseInt(localStorage.getItem('lastupdate')) || null;
    if (cachedata && lastupd) {
      const interval = Date.now() - lastupd;
      if (interval >= 600000) {
        requestStats();
      } else {
        statsParse(cachedata);
      }
    } else {
      requestStats();
    }
  }

  function getIssues () {
    const cacheissues = JSON.parse(localStorage.getItem('issues'));
    const lastupd = parseInt(localStorage.getItem('lastupdate')) || null;
    if (cacheissues && lastupd) {
      const interval = Date.now() - lastupd;
      if (interval >= 600000) {
        requestIssues();
      } else {
        issuesParse(cacheissues);
      }
    } else {
      requestIssues();
    }
  }
  getStats();
  getIssues();
});
