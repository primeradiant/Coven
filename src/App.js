import React, { Component } from 'react';
import { Row, Col, Button, Layout, Tabs, Table, Divider, Modal, Input, Popconfirm, message } from 'antd';
import Web3 from 'web3';
import getWeb3 from "./utils/getWeb3";
import ContractsProvider from './services/ContractsProvider';
import 'antd/dist/antd.css';
import './App.css';

const { Header, Content } = Layout;
const { TabPane } = Tabs;

function getQueryString(name) {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
  var r = window.location.search.substr(1).match(reg);
  if (r != null) return unescape(r[2]); return null;
}

class App extends Component {
  constructor(props) {
    super(props)
    this.web3 = getWeb3();
    window.addEventListener('load', async () => {
      if (window.Web3) {
        if (window.ethereum) {
          window.web3 = new Web3(window.ethereum);
          await window.ethereum.enable();
        } else if (window.web3) {
          window.web3 = new Web3(this.currentProvider);
        } else {
          alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
        }
      }
    });
    const tab = getQueryString('tab')
    this.state = {
      defaultActiveKey: tab ? tab : '1',
      account: '',
      modalData: '',
      placeholder: '',
      modalTitle: '',
      visible: false,
      staked: 0,
      borrowed: 0,
      pendingShares: 0,
      interestAmount: 0,
      creditLimit: 0,
      borrowRate: 0,
      totalStakedBalance: 0,
      columns: [
        {
          title: 'Address',
          dataIndex: 'address',
          key: 'address'
        },
        // {
        //   title: '动作',
        //   key: 'action',
        //   render: (text, record) => (
        //     <Popconfirm
        //       title="Are you sure delete this address?"
        //       onConfirm={this.confirm.bind(this)}
        //       onCancel={this.cancel.bind(this)}
        //       okText="Yes"
        //       cancelText="No"
        //     >
        //       <a href="#">Delete</a>
        //     </Popconfirm>
        //   ),
        // },
      ]
    }
  }

  async componentDidMount() {
    this.contractsProvider = new ContractsProvider();
    await this.contractsProvider.init();
    const accounts = await this.getAccounts();
    const borrowRate = await this.contractsProvider.getBorrowRate();

    await this.setState({
      account: accounts[0],
      borrowRate,
    })
    await this.updateData();
    await this.updateBackees();
  }

  async updateData() {
    const data = await this.contractsProvider.getData();
    const pendingShares = await this.contractsProvider.pendingShares();
    const creditLimit = await this.contractsProvider.getCreditLimit();
    const totalStakedBalance = await this.contractsProvider.getTotalStakedBalance();
    this.setState({
      staked: data.staked,
      borrowed: data.borrowed,
      interestAmount: data.interestAmount,
      pendingShares,
      creditLimit,
      totalStakedBalance
    })
  }

  async updateBackees() {
    const backees = await this.contractsProvider.getBackees();
    let data = [];
    backees.forEach((v, k) => {
      data.push({
        key: k,
        address: v
      })
    });
    this.setState({
      data
    })
  }

  async getAccounts() {
    if (!this.web3 || !window.Web3) {
      return null
    }

    return await this.web3.eth.getAccounts();
  }

  async accrueInterest() {
    await this.contractsProvider.accrueInterest();
    message.success('has call');
  }

  showDepositModal() {
    this.setState({
      modalTitle: 'Deposit',
      placeholder: 'Please enter the deposit amount',
      visible: true,
    });

    this.handleOk = async () => {
      await this.contractsProvider.deposit(this.state.modalData)
      await this.updateData();
      this.setState({
        visible: false,
        modalData: ''
      });
    }
  };

  showWithdrawModal() {
    this.setState({
      modalTitle: 'Withdraw',
      placeholder: 'Please enter the withdrawal amount',
      visible: true,
    });

    this.handleOk = async () => {
      await this.contractsProvider.withdraw(this.state.modalData)
      await this.updateData();
      this.setState({
        visible: false,
        modalData: ''
      });
    }
  };

  showAddAddressModal() {
    this.setState({
      modalTitle: 'Add Address',
      placeholder: 'Please enter the income address',
      visible: true,
    });

    this.handleOk = async () => {
      await this.contractsProvider.vouchFor(this.state.modalData);
      await this.updateBackees();
      this.setState({
        visible: false,
        modalData: ''
      });
    }
  };

  showBorrowModal() {
    this.setState({
      modalTitle: 'Borrow',
      placeholder: 'Please enter the amount of the loan',
      visible: true,
    });

    this.handleOk = async () => {
      await this.contractsProvider.borrow(this.state.modalData)
      await this.updateData();
      this.setState({
        visible: false,
        modalData: ''
      });
    }
  };

  showRepayModal() {
    this.setState({
      modalTitle: 'Repay',
      placeholder: 'Please enter the repayment amount',
      visible: true,
    });

    this.handleOk = async () => {
      await this.contractsProvider.repay(this.state.modalData)
      await this.updateData();
      this.setState({
        visible: false,
        modalData: ''
      });
    }
  };

  handleOk(e) {
    this.setState({
      visible: false,
      modalData: ''
    });
  };

  handleCancel(e) {
    this.setState({
      visible: false,
      modalData: ''
    });
  };

  changeModalData(e) {
    const { value } = e.target;
    this.setState({
      modalData: value,
    });
  }

  confirm(e) {
    message.success('Click on Yes');
  }

  cancel(e) {
    message.error('Click on No');
  }

  render() {
    return (
      <div>
        <Layout>
          <Header><h1>COVEN</h1></Header>
          <Content>
            <Tabs defaultActiveKey={this.state.defaultActiveKey}>
              <TabPane tab="Members" key="1">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ textAlign: 'left', padding: '16px' }}>Account: {this.state.account}</div>
                  <h2>Staked Balance： {this.state.staked} DAI</h2>
                  <h2>COVEN Share： {this.state.pendingShares} CVN</h2>
                  <h2>Pool Balance： {this.state.totalStakedBalance} DAI</h2>
                  <Row>
                    <Col span={8} style={{ padding: '16px' }}>
                      <Button type="primary" block size="large" onClick={this.showDepositModal.bind(this)}>Deposit</Button>
                    </Col>
                    <Col span={8} style={{ padding: '16px' }}>
                      <Button block size="large" onClick={this.showWithdrawModal.bind(this)}>Withdraw</Button>
                    </Col>
                    <Col span={8} style={{ padding: '16px' }}>
                      <Button block size="large" onClick={this.accrueInterest.bind(this)}>AccrueInterest</Button>
                    </Col>
                  </Row>
                  <h2 style={{ textAlign: 'left', padding: '16px' }}>
                    Backed Members
                    <Button type="primary" style={{ float: 'right' }} onClick={this.showAddAddressModal.bind(this)}>Support New Member</Button>
                  </h2>
                  <Table columns={this.state.columns} dataSource={this.state.data} style={{ padding: '16px' }} />
                </div>
              </TabPane>
              <TabPane tab="Borrowers" key="2">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ padding: '16px' }}>{this.state.account}</div>
                  <Row>
                    <Col span={12} style={{ padding: '16px' }}>
                      <h2>Credit Limit： {this.state.creditLimit} DAI</h2>
                    </Col>
                    <Col span={12} style={{ padding: '16px' }}>
                      <h2>Borrowed Amount： {this.state.borrowed} DAI</h2>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={12} style={{ padding: '16px' }}>
                      <h2>Interest Rate：{(this.state.borrowRate * 100).toFixed(2)} %</h2>
                    </Col>
                    <Col span={12} style={{ padding: '16px' }}>
                      <h2>Interest Rate：{(this.state.interestAmount).toFixed(8)} DAI</h2>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={12} style={{ padding: '16px' }}>
                      <Button type="primary" block size="large" onClick={this.showBorrowModal.bind(this)}>Borrow</Button>
                    </Col>
                    <Col span={12} style={{ padding: '16px' }}>
                      <Button block size="large" onClick={this.showRepayModal.bind(this)}>Repay</Button>
                    </Col>
                  </Row>
                </div>
              </TabPane>
            </Tabs>
          </Content>
        </Layout>
        <Modal
          title={this.state.modalTitle}
          visible={this.state.visible}
          onOk={this.handleOk.bind(this)}
          onCancel={this.handleCancel.bind(this)}
        >
          <Input placeholder={this.state.placeholder} value={this.state.modalData} onChange={this.changeModalData.bind(this)} />
        </Modal>
      </div>
    );
  }
}

export default App;
