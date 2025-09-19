import React, { useState, useEffect } from "react";
import './App.css';
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [totalRequests, setTotalRequests] = useState(0);
  const [suspiciousIPs, setSuspiciousIPs] = useState(0);
  const [blockedIPs, setBlockedIPs] = useState(0);
  const [latestIP, setLatestIP] = useState("N/A");
  const [suspiciousList, setSuspiciousList] = useState([]);
  const [blockedList, setBlockedList] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Requests per Minute",
        data: [],
        backgroundColor: "rgba(46, 204, 113, 0.2)",
        borderColor: "rgba(46, 204, 113, 1)",
        borderWidth: 2,
        tension: 0.3
      }
    ]
  });

  useEffect(() => {
    // Fetch stats every 5 seconds
    const interval = setInterval(async () => {
      try {
        const requestsRes = await axios.get("http://localhost:5000/api/requests");
        const suspiciousRes = await axios.get("http://localhost:5000/api/suspicious");
        const blockedRes = await axios.get("http://localhost:5000/api/blocked");
        const suspiciousListRes = await axios.get("http://localhost:5000/api/suspicious-ips");
        const blockedListRes = await axios.get("http://localhost:5000/api/blocked-ips");

        setTotalRequests(requestsRes.data.totalRequests);
        setLatestIP(requestsRes.data.latestIP || "N/A");
        setSuspiciousIPs(suspiciousRes.data.suspiciousIPs);
        setBlockedIPs(blockedRes.data.blockedIPs);
        setSuspiciousList(suspiciousListRes.data);
        setBlockedList(blockedListRes.data);

        // Update chart
        const now = new Date().toLocaleTimeString();
        setChartData(prev => {
          let labels = [...prev.labels, now];
          let data = [...prev.datasets[0].data, requestsRes.data.totalRequests];

          if (labels.length > 10) {
            labels.shift();
            data.shift();
          }

          return {
            labels,
            datasets: [{ ...prev.datasets[0], data }]
          };
        });

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <h1>Smart Shield Against DoS</h1>

      <div className="content">
        <div className="cards-row">
          <div className="card">
            <h2>Total Requests</h2>
            <p>{totalRequests}</p>
          </div>
          <div className="card">
            <h2>Latest Request IP</h2>
            <p>{latestIP}</p>
          </div>
          <div className="card">
            <h2>Suspicious IPs</h2>
            <p>{suspiciousIPs}</p>
          </div>
          <div className="card">
            <h2>Blocked IPs</h2>
            <p>{blockedIPs}</p>
          </div>
        </div>

        <div className="chart-container">
          <Line data={chartData} />
        </div>
      </div>

      <div className="ip-lists">
        <div className="ip-table">
          <h3>Suspicious IPs</h3>
          <table>
            <thead>
              <tr>
                <th>IP Address</th>
                <th>Requests</th>
                <th>Last Request</th>
              </tr>
            </thead>
            <tbody>
              {suspiciousList.map(ip => (
                <tr key={ip.ip_address}>
                  <td>{ip.ip_address}</td>
                  <td>{ip.request_count}</td>
                  <td>{new Date(ip.last_request).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ip-table">
          <h3>Blocked IPs</h3>
          <table>
            <thead>
              <tr>
                <th>IP Address</th>
                <th>Blocked At</th>
              </tr>
            </thead>
            <tbody>
              {blockedList.map(ip => (
                <tr key={ip.ip_address}>
                  <td>{ip.ip_address}</td>
                  <td>{new Date(ip.blocked_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
