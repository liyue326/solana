import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import idl from './dao_voting_platform.json';

function App() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState(null);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 表单状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(24);

  // 初始化程序
  useEffect(() => {
    if (wallet && connection) {
      try {
        const provider = new AnchorProvider(connection, wallet, {});
        const program = new Program(idl, provider);
        setProgram(program);
        fetchVotes(program);
      } catch (error) {
        console.error('初始化程序失败:', error);
      }
    }
  }, [wallet, connection]);

  const fetchVotes = async (programInstance) => {
    try {
      const voteAccounts = await programInstance.account.vote.all();
      setVotes(voteAccounts);
    } catch (error) {
      console.error('获取投票失败:', error);
    }
  };

  const createVote = async () => {
    console.log('program:', program);
    console.log('wallet.publicKey:', wallet.publicKey);
    if (!program || !wallet.publicKey) {
      alert('请先连接钱包');
      return;
    }

    if (!title.trim()) {
      alert('请输入投票标题');
      return;
    }

    const filteredOptions = options.filter(opt => opt.trim() !== '');
    if (filteredOptions.length < 2) {
      alert('请至少提供2个选项');
      return;
    }

    setLoading(true);
    try {
      const endTime = Math.floor(Date.now() / 1000) + (duration * 3600);
      
      const [votePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vote'), wallet.publicKey.toBuffer(), Buffer.from(title)],
        program.programId
      );

      const tx = await program.methods
        .createVote(title, description, filteredOptions, new BN(endTime))
        .accounts({
          authority: wallet.publicKey,
          vote: votePda,
        })
        .rpc();

      console.log('投票创建成功:', tx);
      
      // 重置表单
      setTitle('');
      setDescription('');
      setOptions(['', '']);
      setDuration(24);
      
      // 刷新投票列表
      await fetchVotes(program);
      
      alert('投票创建成功！');
    } catch (error) {
      console.error('创建投票失败:', error);
      alert('创建投票失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const castVote = async (votePublicKey, optionIndex) => {
    if (!program || !wallet.publicKey) {
      alert('请先连接钱包');
      return;
    }

    setLoading(true);
    try {
      const votePubkey = new PublicKey(votePublicKey);
      const [voterRecordPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('voter'), votePubkey.toBuffer(), wallet.publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .castVote(optionIndex)
        .accounts({
          voter: wallet.publicKey,
          vote: votePubkey,
          voterRecord: voterRecordPda,
        })
        .rpc();

      console.log('投票成功:', tx);
      await fetchVotes(program);
      alert('投票成功！');
    } catch (error) {
      console.error('投票失败:', error);
      if (error.message.includes('Already voted')) {
        alert('您已经投过票了！');
      } else if (error.message.includes('VoteEnded')) {
        alert('投票已结束！');
      } else {
        alert('投票失败: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="App">
      <div className="container">
        {/* 头部 */}
        <div className="header">
          <h1>🗳️ DAO 投票平台</h1>
          <div className="wallet-section">
            <WalletMultiButton />
          </div>
        </div>

        {wallet.connected ? (
          <div className="content">
            {/* 左侧：创建投票 */}
            <div className="card">
              <h2>创建新投票</h2>
              
              <div className="form-group">
                <label>投票标题 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：最佳编程语言"
                  maxLength="100"
                />
              </div>

              <div className="form-group">
                <label>投票描述</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述你的投票内容..."
                  rows="3"
                  maxLength="500"
                />
              </div>

              <div className="form-group">
                <label>投票选项 ({options.length}/10) *</label>
                {options.map((option, index) => (
                  <div key={index} className="option-row">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`选项 ${index + 1}`}
                      maxLength="50"
                    />
                    {options.length > 2 && (
                      <button 
                        type="button"
                        onClick={() => removeOption(index)}
                        className="remove-btn"
                      >
                        删除
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={addOption}
                  disabled={options.length >= 10}
                  className="add-btn"
                >
                  + 添加选项
                </button>
              </div>

              <div className="form-group">
                <label>投票时长</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  <option value={1}>1 小时</option>
                  <option value={6}>6 小时</option>
                  <option value={24}>24 小时</option>
                  <option value={168}>7 天</option>
                </select>
              </div>

              <button
                onClick={createVote}
                disabled={loading || !title.trim()}
                className="create-btn"
              >
                {loading ? '创建中...' : '创建投票'}
              </button>
            </div>

            {/* 右侧：投票列表 */}
            <div className="card">
              <div className="card-header">
                <h2>投票列表</h2>
                <button 
                  onClick={() => fetchVotes(program)} 
                  className="refresh-btn"
                >
                  刷新
                </button>
              </div>
              
              {votes.length === 0 ? (
                <div className="empty-state">
                  <p>📝 还没有投票活动</p>
                  <p>创建第一个投票吧！</p>
                </div>
              ) : (
                <div className="votes-list">
                  {votes.map((vote) => (
                    <VoteCard 
                      key={vote.publicKey.toString()}
                      vote={vote}
                      onVote={castVote}
                      loading={loading}
                      wallet={wallet}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="welcome-card">
            <h2>🚀 欢迎使用 DAO 投票平台</h2>
            <p>连接你的钱包开始创建和参与投票</p>
            <div className="features">
              <div className="feature">
                <span>✅</span>
                <span>创建自定义投票</span>
              </div>
              <div className="feature">
                <span>✅</span>
                <span>实时查看投票结果</span>
              </div>
              <div className="feature">
                <span>✅</span>
                <span>防重复投票机制</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 投票卡片组件
function VoteCard({ vote, onVote, loading, wallet }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const voteData = vote.account;

  const isActive = voteData.isActive && Date.now() / 1000 < voteData.endTime.toNumber();
  const totalVotes = voteData.totalVotes.toNumber();
  const timeRemaining = voteData.endTime.toNumber() - Math.floor(Date.now() / 1000);

  const handleVote = () => {
    if (selectedOption !== null) {
      onVote(vote.publicKey.toString(), selectedOption);
    }
  };

  const formatTimeRemaining = () => {
    if (timeRemaining <= 0) return '已结束';
    
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  return (
    <div className="vote-card">
      <div className="vote-header">
        <h3>{voteData.title}</h3>
        <div className="vote-status">
          <span className={`status-badge ${isActive ? 'active' : 'ended'}`}>
            {isActive ? `剩余: ${formatTimeRemaining()}` : '已结束'}
          </span>
        </div>
      </div>

      <p className="vote-description">{voteData.description}</p>

      {/* 投票选项和进度 */}
      <div className="vote-options">
        {voteData.options.map((option, index) => {
          const voteCount = voteData.voteCounts[index]?.toNumber() || 0;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          
          return (
            <div key={index} className="option-result">
              <div className="option-info">
                <span className="option-text">{option}</span>
                <span className="option-stats">
                  {voteCount} 票 ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="vote-footer">
        <span className="total-votes">总票数: {totalVotes}</span>
        <span className="creator">
          创建者: {voteData.authority.toString().slice(0, 8)}...
        </span>
      </div>

      {/* 投票按钮 */}
      {isActive && wallet.connected && (
        <div className="vote-actions">
          <div className="option-buttons">
            {voteData.options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                className={`option-btn ${selectedOption === index ? 'selected' : ''}`}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            onClick={handleVote}
            disabled={loading || selectedOption === null}
            className="vote-btn"
          >
            {loading ? '投票中...' : '确认投票'}
          </button>
        </div>
      )}

      {!isActive && (
        <div className="vote-ended">
          <span>⏰ 投票已结束</span>
        </div>
      )}
    </div>
  );
}

export default App;