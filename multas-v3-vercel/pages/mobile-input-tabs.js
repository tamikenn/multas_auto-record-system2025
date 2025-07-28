import { useState, useEffect, useRef } from 'react';
import { storage } from '../lib/storage';
import { getCategoryName } from '../lib/categories';
import dynamic from 'next/dynamic';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// 動的インポート（SSR回避）
const RadarChart = dynamic(() => import('../components/RadarChart'), { ssr: false });
const SharedLearning = dynamic(() => import('../components/SharedLearning'), { ssr: false });

// Version 3.3 - Level system removed
export default function MobileInputTabs() {
  const [text, setText] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('LOG');
  const [reportLoading, setReportLoading] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [shareConfirmPost, setShareConfirmPost] = useState(null);
  const [sharedPosts, setSharedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [reportDate, setReportDate] = useState('all'); // レポート用の日付フィルター
  const mainRef = useRef(null);
  
  const tabs = ['LOG', 'LIST', 'REPORT', 'みんな'];

  // 初回読み込み時にローカルストレージからデータを復元
  useEffect(() => {
    setIsClient(true);
    
    // ユーザー情報を読み込み
    const savedUser = storage.getCurrentUser();
    if (!savedUser) {
      setShowLogin(true);
      // ログインしていない場合は、初期値を確実に設定
      setPosts([]);
      setSharedPosts([]);
      setLikedPosts([]);
    } else {
      setCurrentUser(savedUser);
      // ログイン済みの場合、ユーザーの投稿を読み込み
      const savedPosts = storage.loadPosts() || [];
      setPosts(savedPosts);
      
      // サーバーからシェアされた投稿を読み込み
      fetch('/api/get-shared-posts')
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setSharedPosts(data.posts || []);
          }
        })
        .catch(error => {
          console.error('Error loading shared posts:', error);
          // フォールバック: ローカルストレージから読み込み
          const savedSharedPosts = storage.loadSharedPosts() || [];
          setSharedPosts(savedSharedPosts);
        });
      
      // いいねした投稿を読み込み
      const savedLikedPosts = storage.getLikedPosts() || [];
      setLikedPosts(savedLikedPosts);
    }
  }, []);
  
  // ログイン処理
  const handleLogin = () => {
    if (!loginName.trim()) return;
    
    const username = loginName.trim();
    storage.setCurrentUser(username);
    setCurrentUser(username);
    setLoginName('');
    
    // ユーザー別の投稿データを読み込み
    const savedPosts = storage.loadPosts();
    console.log('Loaded posts:', savedPosts);
    
    // 確実に配列を設定
    if (!Array.isArray(savedPosts)) {
      console.error('savedPosts is not an array:', savedPosts);
      setPosts([]);
    } else {
      setPosts(savedPosts);
    }
    
    // サーバーからシェアされた投稿を読み込み
    fetch('/api/get-shared-posts')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setSharedPosts(data.posts || []);
        }
      })
      .catch(error => {
        console.error('Error loading shared posts:', error);
        // フォールバック: ローカルストレージから読み込み
        const savedSharedPosts = storage.loadSharedPosts() || [];
        setSharedPosts(savedSharedPosts);
      });
    
    // いいねした投稿を読み込み
    const savedLikedPosts = storage.getLikedPosts() || [];
    setLikedPosts(savedLikedPosts);
    
    // 最後にログイン画面を非表示にする
    setShowLogin(false);
  };
  
  // ログアウト処理
  const handleLogout = () => {
    storage.clearCurrentUser();
    setCurrentUser(null);
    setShowLogin(true);
    setPosts([]);
  };
  
  // シェア処理
  const handleShare = async (post) => {
    try {
      // サーバーに送信
      const response = await fetch('/api/share-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          post: {
            ...post,
            sharedBy: currentUser,
            likes: {},
            likeCount: 0
          }
        })
      });
      
      if (response.ok) {
        // サーバーから最新のシェア投稿を再取得
        const getResponse = await fetch('/api/get-shared-posts');
        if (getResponse.ok) {
          const data = await getResponse.json();
          setSharedPosts(data.posts || []);
        }
        
        // ローカルストレージにも保存（バックアップ）
        storage.addSharedPost(post);
      } else {
        throw new Error('Failed to share post');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      alert('投稿のシェアに失敗しました');
    }
    
    setShareConfirmPost(null);
  };
  
  // いいね処理
  const handleLike = async (postId) => {
    const isLiked = likedPosts.includes(postId);
    const action = isLiked ? 'unlike' : 'like';
    
    try {
      // サーバーに送信
      const response = await fetch('/api/toggle-like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          postId,
          userId: currentUser,
          action
        })
      });
      
      if (response.ok) {
        // ローカルの状態を更新
        if (action === 'like') {
          setLikedPosts([...likedPosts, postId]);
        } else {
          setLikedPosts(likedPosts.filter(id => id !== postId));
        }
        
        // サーバーから最新のシェア投稿を再取得
        const getResponse = await fetch('/api/get-shared-posts');
        if (getResponse.ok) {
          const data = await getResponse.json();
          setSharedPosts(data.posts || []);
        }
        
        // ローカルストレージも更新（バックアップ）
        storage.toggleLike(postId);
      } else {
        throw new Error('Failed to toggle like');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('いいねの更新に失敗しました');
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    
    try {
      // 1. OpenAI APIで分類（長文対応）
      const classifyResponse = await fetch('/api/classify-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const classifyData = await classifyResponse.json();
      
      // 2. 複数要素の場合の処理
      let postsToAdd = [];
      
      if (classifyData.isMultiple) {
        // 複数要素がある場合
        
        // まず、オリジナルのテキストを保存（LOG表示用）
        postsToAdd.push({
          id: Date.now(),
          text: text,
          category: classifyData.elements[0].category, // 最初の要素のカテゴリを使用
          reason: '複数要素を含む',
          timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
          isOriginal: true,
          hasElements: true,
          username: currentUser
        });
        
        // 次に、分解された要素を保存（LIST/REPORT用）
        for (const element of classifyData.elements) {
          // Google Sheetsに各要素を保存
          await fetch('/api/save-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              text: element.text,
              category: element.category,
              reason: element.reason,
              userName: currentUser
            })
          });
          
          postsToAdd.push({
            id: Date.now() + Math.random(),
            text: element.text,
            category: element.category,
            reason: element.reason,
            timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
            isElement: true,
            originalId: Date.now(),
            username: currentUser
          });
        }
      } else {
        // 単一要素の場合（従来の処理）
        await fetch('/api/save-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text,
            category: classifyData.category,
            reason: classifyData.reason,
            userName: currentUser
          })
        });
        
        postsToAdd.push({
          id: Date.now(),
          text,
          category: classifyData.category,
          reason: classifyData.reason,
          timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
          username: currentUser
        });
      }
      
      // ローカルストレージに保存
      let updatedPosts = [...posts];
      for (const post of postsToAdd) {
        updatedPosts = storage.addPost(post);
      }
      setPosts(updatedPosts);
      setText('');
      
      // 最新の投稿が見えるように一番上にスクロール
      setTimeout(() => {
        if (mainRef.current) {
          mainRef.current.scrollTop = 0;
          window.scrollTo(0, 0);
        }
      }, 300);
      
    } catch (error) {
      console.error('投稿エラー:', error);
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 投稿を削除
  const handleDelete = async (postId) => {
    const postToDelete = (posts || []).find(p => p.id === postId);
    if (!postToDelete) return;
    
    // オリジナルポストの場合、関連する要素も削除
    const postsToRemove = [postId];
    if (postToDelete.hasElements) {
      const relatedElements = (posts || []).filter(p => p.originalId === postId);
      postsToRemove.push(...relatedElements.map(p => p.id));
    }
    
    // ローカルストレージから削除
    postsToRemove.forEach(id => storage.removePost(id));
    const updatedPosts = (posts || []).filter(p => !postsToRemove.includes(p.id));
    setPosts(updatedPosts);
    setDeleteConfirmId(null);
  };

  // 投稿を編集
  const handleEdit = async (postId) => {
    if (!editText.trim()) return;
    
    const postToEdit = (posts || []).find(p => p.id === postId);
    if (!postToEdit) return;
    
    setLoading(true);
    
    try {
      // 1. 編集したテキストを再分類
      const classifyResponse = await fetch('/api/classify-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText })
      });
      const classifyData = await classifyResponse.json();
      
      // 2. 既存の関連要素を削除
      let updatedPosts = [...posts];
      if (postToEdit.hasElements) {
        const relatedElements = (posts || []).filter(p => p.originalId === postId);
        const idsToRemove = relatedElements.map(p => p.id);
        idsToRemove.forEach(id => storage.removePost(id));
        updatedPosts = updatedPosts.filter(p => !idsToRemove.includes(p.id));
      }
      
      // 3. 新しいデータで更新
      const updatedPost = {
        ...postToEdit,
        text: editText,
        category: classifyData.isMultiple ? classifyData.elements[0].category : classifyData.category,
        reason: classifyData.isMultiple ? '複数要素を含む' : classifyData.reason,
        hasElements: classifyData.isMultiple,
        edited: true,
        editedAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
      };
      
      // 4. 複数要素の場合は新しい要素を追加
      if (classifyData.isMultiple) {
        for (const element of classifyData.elements) {
          const elementPost = {
            id: Date.now() + Math.random(),
            text: element.text,
            category: element.category,
            reason: element.reason,
            timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
            isElement: true,
            originalId: postId,
            userName: currentUser
          };
          updatedPosts.push(elementPost);
          storage.addPost(elementPost);
          
          // Google Sheetsに保存
          await fetch('/api/save-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              text: element.text,
              category: element.category,
              reason: element.reason,
              userName: currentUser
            })
          });
        }
      } else {
        // Google Sheetsに更新を送信
        await fetch('/api/save-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: editText,
            category: updatedPost.category,
            reason: updatedPost.reason,
            userName: currentUser
          })
        });
      }
      
      // 5. 元の投稿を更新
      updatedPosts = updatedPosts.map(p => p.id === postId ? updatedPost : p);
      storage.updatePost(updatedPost);
      setPosts(updatedPosts);
      
      setEditingPost(null);
      setEditText('');
      
    } catch (error) {
      console.error('編集エラー:', error);
      alert('編集に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // カテゴリ別にグループ化（LIST/REPORT用）
  // 要素分解されたものを優先、オリジナルで要素分解されたものは除外
  const displayPosts = (posts || []).filter(post => {
    if (!post) return false;
    // 要素分解されたものは含める
    if (post.isElement) return true;
    // オリジナルで要素分解されていないものは含める
    if (!post.hasElements) return true;
    // オリジナルで要素分解されたものは除外
    return false;
  });
  
  // REPORTタブ用：日付でフィルタリングされた投稿
  const getFilteredPostsForReport = () => {
    // 日付の定義
    const dateMappings = {
      '1': '2025-07-28',
      '2': '2025-07-29',
      '3': '2025-07-30',
      '4': '2025-07-31',
      '5': '2025-08-01'
    };
    
    if (reportDate === 'all') {
      // 全期間: 1-5日目のみ（練習日を除く）
      const definedDates = Object.values(dateMappings);
      return displayPosts.filter(post => {
        if (!post.timestamp) return false;
        const postDate = new Date(post.timestamp).toISOString().split('T')[0];
        return definedDates.includes(postDate);
      });
    }
    
    if (reportDate === 'practice') {
      // 練習日: 定義された日付以外の投稿
      const definedDates = Object.values(dateMappings);
      return displayPosts.filter(post => {
        if (!post.timestamp) return false;
        const postDate = new Date(post.timestamp).toISOString().split('T')[0];
        return !definedDates.includes(postDate);
      });
    }
    
    // 特定の日付の投稿をフィルタリング
    const targetDate = dateMappings[reportDate];
    if (!targetDate) return [];
    
    return displayPosts.filter(post => {
      if (!post.timestamp) return false;
      const postDate = new Date(post.timestamp).toISOString().split('T')[0];
      return postDate === targetDate;
    });
  };
  
  const groupedPosts = displayPosts.reduce((acc, post) => {
    const category = post.category || '未分類';
    if (!acc[category]) acc[category] = [];
    acc[category].push(post);
    return acc;
  }, {});

  // カテゴリ別カウント（REPORT用）
  const categoryCounts = {};
  for (let i = 1; i <= 12; i++) {
    categoryCounts[i] = displayPosts.filter(p => p.category === i).length;
  }
  
  
  // PDF生成関数
  const generatePDF = async () => {
    try {
      // 現在選択されている日付でフィルタリングされた投稿を取得
      const reportPosts = getFilteredPostsForReport();
      
      // PDFに含めるコンテンツを作成
      const pdfContent = document.createElement('div');
      pdfContent.style.padding = '60px 80px';
      pdfContent.style.backgroundColor = 'white';
      pdfContent.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif';
      pdfContent.style.maxWidth = '1400px';
      pdfContent.style.margin = '0 auto';
      pdfContent.style.color = '#1a1a1a';
      
      // タイトル
      let dateLabel;
      if (reportDate === 'all') {
        dateLabel = '全期間 (1-5日)';
      } else if (reportDate === 'practice') {
        dateLabel = '練習日';
      } else {
        const dateMap = {
          '1': '1日目 (7/28)',
          '2': '2日目 (7/29)',
          '3': '3日目 (7/30)',
          '4': '4日目 (7/31)',
          '5': '5日目 (8/1)'
        };
        dateLabel = dateMap[reportDate] || `${reportDate}日目`;
      }
      // タイトルと基本情報を1つのグループにまとめる
      const headerGroup = document.createElement('div');
      headerGroup.style.pageBreakInside = 'avoid';
      headerGroup.style.minHeight = '350px';
      
      const title = document.createElement('h1');
      title.textContent = `MULTAs 実習レポート`;
      title.style.textAlign = 'center';
      title.style.marginBottom = '16px';
      title.style.fontSize = '42px';
      title.style.fontWeight = '300';
      title.style.color = '#1a1a1a';
      title.style.letterSpacing = '8px';
      title.style.textTransform = 'uppercase';
      headerGroup.appendChild(title);
      
      const subtitle = document.createElement('h2');
      subtitle.textContent = dateLabel;
      subtitle.style.textAlign = 'center';
      subtitle.style.marginBottom = '60px';
      subtitle.style.fontSize = '18px';
      subtitle.style.color = '#666666';
      subtitle.style.fontWeight = '400';
      subtitle.style.letterSpacing = '2px';
      headerGroup.appendChild(subtitle);
      
      // 基本情報
      const info = document.createElement('div');
      info.style.display = 'flex';
      info.style.justifyContent = 'center';
      info.style.gap = '80px';
      info.style.marginBottom = '80px';
      info.style.borderTop = '1px solid #e0e0e0';
      info.style.borderBottom = '1px solid #e0e0e0';
      info.style.padding = '30px 0';
      
      const infoItems = [
        { label: '生成日時', value: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }), isDate: true },
        { label: '記録者', value: currentUser || '未設定', isDate: false },
        { label: '総記録数', value: reportPosts.length, isCount: true }
      ];
      
      infoItems.forEach(item => {
        const infoItem = document.createElement('div');
        infoItem.style.textAlign = 'center';
        
        const label = document.createElement('div');
        label.textContent = item.label;
        label.style.fontSize = '14px';
        label.style.color = '#888888';
        label.style.marginBottom = '8px';
        label.style.fontWeight = '500';
        label.style.letterSpacing = '1px';
        
        const value = document.createElement('div');
        value.textContent = item.isCount ? `${item.value} 件` : item.value;
        value.style.fontSize = item.isCount ? '28px' : '16px';
        value.style.color = '#1a1a1a';
        value.style.fontWeight = item.isCount ? '600' : '400';
        
        infoItem.appendChild(label);
        infoItem.appendChild(value);
        info.appendChild(infoItem);
      });
      
      headerGroup.appendChild(info);
      pdfContent.appendChild(headerGroup);
      
      // レーダーチャートとカテゴリ別集計を中央に配置
      const analysisWrapper = document.createElement('div');
      analysisWrapper.style.display = 'flex';
      analysisWrapper.style.justifyContent = 'center';
      analysisWrapper.style.marginTop = '20px';
      analysisWrapper.style.marginBottom = '60px';
      analysisWrapper.style.pageBreakInside = 'avoid';
      
      const analysisContainer = document.createElement('div');
      analysisContainer.style.display = 'flex';
      analysisContainer.style.gap = '80px';
      analysisContainer.style.maxWidth = '1200px';
      analysisContainer.style.width = '100%';
      analysisContainer.style.alignItems = 'stretch';
      
      // レーダーチャートセクション（左側）
      const chartSection = document.createElement('div');
      chartSection.style.flex = '1.2';
      chartSection.style.display = 'flex';
      chartSection.style.flexDirection = 'column';
      
      const chartTitle = document.createElement('h3');
      chartTitle.textContent = '12時計分類レーダーチャート';
      chartTitle.style.textAlign = 'center';
      chartTitle.style.marginBottom = '40px';
      chartTitle.style.fontSize = '20px';
      chartTitle.style.color = '#1a1a1a';
      chartTitle.style.fontWeight = '400';
      chartTitle.style.letterSpacing = '2px';
      chartSection.appendChild(chartTitle);
      
      // レーダーチャートをキャプチャ
      const radarChartElement = document.querySelector('canvas');
      if (radarChartElement) {
        const chartContainer = document.createElement('div');
        chartContainer.style.textAlign = 'center';
        chartContainer.style.padding = '60px';
        chartContainer.style.backgroundColor = '#fafafa';
        chartContainer.style.borderRadius = '16px';
        chartContainer.style.display = 'flex';
        chartContainer.style.alignItems = 'center';
        chartContainer.style.justifyContent = 'center';
        chartContainer.style.minHeight = '600px';
        chartContainer.style.border = '1px solid #f0f0f0';
        
        // より高解像度でキャプチャ
        const tempCanvas = document.createElement('canvas');
        const scale = 4; // 高解像度スケール
        tempCanvas.width = radarChartElement.width * scale;
        tempCanvas.height = radarChartElement.height * scale;
        const ctx = tempCanvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.drawImage(radarChartElement, 0, 0);
        
        const chartImage = document.createElement('img');
        chartImage.src = tempCanvas.toDataURL('image/png', 1.0);
        chartImage.style.width = '100%';
        chartImage.style.maxWidth = '600px';
        chartImage.style.height = 'auto';
        chartImage.style.filter = 'grayscale(90%) contrast(1.2) brightness(1.05)';
        
        chartContainer.appendChild(chartImage);
        chartSection.appendChild(chartContainer);
      }
      
      analysisContainer.appendChild(chartSection);
      
      // カテゴリ別集計（右側）
      const reportCategoryCounts = {};
      for (let i = 1; i <= 12; i++) {
        reportCategoryCounts[i] = reportPosts.filter(p => p.category === i).length;
      }
      
      const categorySection = document.createElement('div');
      categorySection.style.flex = '1';
      categorySection.style.display = 'flex';
      categorySection.style.flexDirection = 'column';
      
      const categoryTitle = document.createElement('h3');
      categoryTitle.textContent = 'カテゴリ別集計ランキング';
      categoryTitle.style.fontSize = '20px';
      categoryTitle.style.color = '#1a1a1a';
      categoryTitle.style.marginBottom = '40px';
      categoryTitle.style.fontWeight = '400';
      categoryTitle.style.textAlign = 'center';
      categoryTitle.style.letterSpacing = '2px';
      categorySection.appendChild(categoryTitle);
      
      const categoryContainer = document.createElement('div');
      categoryContainer.style.backgroundColor = '#ffffff';
      categoryContainer.style.padding = '0';
      categoryContainer.style.border = '1px solid #f0f0f0';
      categoryContainer.style.borderRadius = '16px';
      categoryContainer.style.overflow = 'hidden';
      categoryContainer.style.flex = '1';
      
      // ポイント順でソートして表示
      Object.entries(reportCategoryCounts)
        .filter(([cat, count]) => count > 0)
        .sort(([, a], [, b]) => b - a)
        .forEach(([cat, count], index) => {
          const categoryItem = document.createElement('div');
          categoryItem.style.display = 'flex';
          categoryItem.style.alignItems = 'center';
          categoryItem.style.padding = '16px 24px';
          categoryItem.style.marginBottom = '0';
          categoryItem.style.backgroundColor = index === 0 ? '#f8f8f8' : '#ffffff';
          categoryItem.style.borderBottom = index < Object.entries(reportCategoryCounts).filter(([, c]) => c > 0).length - 1 ? '1px solid #f0f0f0' : 'none';
          categoryItem.style.transition = 'background-color 0.2s ease';
          
          const rank = document.createElement('span');
          rank.textContent = `${index + 1}位`;
          rank.style.fontSize = index === 0 ? '20px' : '16px';
          rank.style.fontWeight = index === 0 ? '600' : '400';
          rank.style.color = index === 0 ? '#1a1a1a' : '#666666';
          rank.style.minWidth = '60px';
          rank.style.textAlign = 'center';
          
          const categoryName = document.createElement('span');
          categoryName.textContent = getCategoryName(cat);
          categoryName.style.fontSize = index === 0 ? '18px' : '16px';
          categoryName.style.flex = '1';
          categoryName.style.marginLeft = '20px';
          categoryName.style.fontWeight = index === 0 ? '500' : '400';
          categoryName.style.color = '#333333';
          
          const points = document.createElement('span');
          points.textContent = `${count}pt`;
          points.style.fontSize = index === 0 ? '20px' : '16px';
          points.style.fontWeight = index === 0 ? '600' : '500';
          points.style.color = '#1a1a1a';
          
          categoryItem.appendChild(rank);
          categoryItem.appendChild(categoryName);
          categoryItem.appendChild(points);
          categoryContainer.appendChild(categoryItem);
        });
      
      categorySection.appendChild(categoryContainer);
      analysisContainer.appendChild(categorySection);
      analysisWrapper.appendChild(analysisContainer);
      pdfContent.appendChild(analysisWrapper);
      
      
      // Daily Reportの場合はLISTを列挙、全期間の場合はAI生成
      if (reportDate === 'all') {
        // 全期間（1-5日）のレポートの場合のみAI生成
        const summarySection = document.createElement('div');
        summarySection.style.marginTop = '60px';
        
        const summaryTitle = document.createElement('h2');
        summaryTitle.textContent = '5日間の学習総括';
        summaryTitle.style.fontSize = '28px';
        summaryTitle.style.color = '#000000';
        summaryTitle.style.marginTop = '40px';
        summaryTitle.style.marginBottom = '60px';
        summaryTitle.style.textAlign = 'center';
        summaryTitle.style.fontWeight = '400';
        summaryTitle.style.letterSpacing = '2px';
        summarySection.appendChild(summaryTitle);
        
        // カテゴリ別にグループ化
        const groupedByCategory = reportPosts.reduce((acc, post) => {
          const cat = post.category;
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(post);
          return acc;
        }, {});
        
        // 生成中の表示
        const loadingDiv = document.createElement('div');
        loadingDiv.innerHTML = '<p style="text-align: center; color: #666;">総括レポートを生成中...</p>';
        summarySection.appendChild(loadingDiv);
        pdfContent.appendChild(summarySection);
        
        // 各カテゴリについてAI要約を生成
        const summaryPromises = Object.entries(groupedByCategory)
          .sort(([,a], [,b]) => b.length - a.length)
          .filter(([, posts]) => posts.length > 0)
          .map(async ([category, posts]) => {
            try {
              const postsText = posts.map(p => `・${p.text}`).join('\n');
              const response = await fetch('/api/generate-category-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  category: getCategoryName(category),
                  posts: postsText
                })
              });
              
              const { summary } = await response.json();
              
              return {
                category,
                categoryName: getCategoryName(category),
                summary
              };
            } catch (error) {
              console.error(`Error generating summary for ${category}:`, error);
              return {
                category,
                categoryName: getCategoryName(category),
                summary: `私は${getCategoryName(category)}に関する実習を通じて、${posts[0].text}などの経験をしました。これらの体験は今後の医療実践において重要な基盤となることでしょう。`
              };
            }
          });
        
        // 全ての要約が完了するのを待つ
        const summaries = await Promise.all(summaryPromises);
        
        // ローディング表示を削除
        summarySection.removeChild(loadingDiv);
        
        // AIサマリーの前で確実に改ページ
        summarySection.style.pageBreakBefore = 'always';
        summarySection.style.paddingTop = '40px';
        
        // 生成された要約を表示
        summaries.forEach(({ categoryName, summary }) => {
          const categoryDiv = document.createElement('div');
          categoryDiv.style.marginBottom = '50px';
          categoryDiv.style.padding = '30px';
          categoryDiv.style.backgroundColor = '#fafafa';
          categoryDiv.style.borderLeft = '3px solid #333333';
          categoryDiv.style.pageBreakInside = 'avoid';
          
          const categoryTitle = document.createElement('h3');
          categoryTitle.textContent = categoryName;
          categoryTitle.style.color = '#000000';
          categoryTitle.style.marginBottom = '24px';
          categoryTitle.style.fontSize = '20px';
          categoryTitle.style.fontWeight = '500';
          categoryTitle.style.letterSpacing = '0.5px';
          categoryDiv.appendChild(categoryTitle);
          
          const summaryText = document.createElement('div');
          summaryText.style.lineHeight = '2.2';
          summaryText.style.fontSize = '16px';
          summaryText.style.color = '#333333';
          summaryText.innerHTML = `<p style="text-indent: 1em; margin: 0;">${summary}</p>`;
          
          categoryDiv.appendChild(summaryText);
          summarySection.appendChild(categoryDiv);
        });
      } else {
        // Daily Report（1-5日目、練習日）の場合はシンプルにLISTを表示
        const listSection = document.createElement('div');
        
        // 記録一覧の前で確実に改ページ
        listSection.style.pageBreakBefore = 'always';
        listSection.style.paddingTop = '40px';
        
        
        const listTitle = document.createElement('h2');
        listTitle.textContent = '記録一覧';
        listTitle.style.fontSize = '32px';
        listTitle.style.color = '#1a1a1a';
        listTitle.style.marginTop = '60px';
        listTitle.style.marginBottom = '80px';
        listTitle.style.textAlign = 'center';
        listTitle.style.fontWeight = '300';
        listTitle.style.letterSpacing = '4px';
        
        // 装飾的な下線
        const titleUnderline = document.createElement('div');
        titleUnderline.style.width = '80px';
        titleUnderline.style.height = '2px';
        titleUnderline.style.backgroundColor = '#1a1a1a';
        titleUnderline.style.margin = '20px auto 0';
        
        const titleWrapper = document.createElement('div');
        titleWrapper.appendChild(listTitle);
        titleWrapper.appendChild(titleUnderline);
        listSection.appendChild(titleWrapper);
        
        // カテゴリ別にグループ化して表示
        const groupedByCategory = reportPosts.reduce((acc, post) => {
          const cat = post.category;
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(post);
          return acc;
        }, {});
        
        Object.entries(groupedByCategory)
          .sort(([,a], [,b]) => b.length - a.length)
          .forEach(([category, posts]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.style.marginBottom = '60px';
            categoryDiv.style.backgroundColor = '#fafafa';
            categoryDiv.style.padding = '40px';
            categoryDiv.style.borderRadius = '12px';
            categoryDiv.style.pageBreakInside = 'avoid';
            
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = `${getCategoryName(category)}`;
            categoryTitle.style.color = '#000000';
            categoryTitle.style.fontSize = '20px';
            categoryTitle.style.marginBottom = '30px';
            categoryTitle.style.fontWeight = '500';
            categoryTitle.style.letterSpacing = '0.5px';
            
            const countBadge = document.createElement('span');
            countBadge.textContent = `${posts.length}件`;
            countBadge.style.backgroundColor = '#e0e0e0';
            countBadge.style.color = '#333333';
            countBadge.style.padding = '6px 18px';
            countBadge.style.borderRadius = '4px';
            countBadge.style.fontSize = '16px';
            countBadge.style.marginLeft = '20px';
            countBadge.style.fontWeight = '400';
            categoryTitle.appendChild(countBadge);
            
            categoryDiv.appendChild(categoryTitle);
            
            const postsList = document.createElement('ul');
            postsList.style.paddingLeft = '0';
            postsList.style.listStyle = 'none';
            postsList.style.lineHeight = '2.5';
            postsList.style.marginTop = '30px';
            
            posts.forEach(post => {
              const li = document.createElement('li');
              li.style.marginBottom = '32px';
              li.style.fontSize = '15px';
              li.style.paddingLeft = '28px';
              li.style.position = 'relative';
              li.style.lineHeight = '1.8';
              li.style.color = '#333333';
              
              const bullet = document.createElement('span');
              bullet.textContent = '◆';
              bullet.style.position = 'absolute';
              bullet.style.left = '0';
              bullet.style.top = '4px';
              bullet.style.color = '#d0d0d0';
              bullet.style.fontSize = '10px';
              li.appendChild(bullet);
              
              const postText = document.createElement('span');
              postText.textContent = post.text;
              postText.style.color = '#333333';
              
              const timestamp = document.createElement('span');
              timestamp.textContent = ` (${post.timestamp})`;
              timestamp.style.color = '#aaaaaa';
              timestamp.style.fontSize = '13px';
              timestamp.style.marginLeft = '12px';
              timestamp.style.fontStyle = 'italic';
              
              li.appendChild(postText);
              li.appendChild(timestamp);
              postsList.appendChild(li);
            });
            
            categoryDiv.appendChild(postsList);
            listSection.appendChild(categoryDiv);
          });
        
        pdfContent.appendChild(listSection);
      }
      
      // DOMに一時的に追加
      document.body.appendChild(pdfContent);
      
      // html2canvasでキャプチャ
      const canvas = await html2canvas(pdfContent, {
        scale: 3,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 1600,
        windowHeight: pdfContent.scrollHeight
      });
      
      // jsPDFでPDF生成
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4幅
      const pageHeight = 297; // A4高さ
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // ページ下部に小さなフッター追加
      const footer = document.createElement('div');
      footer.style.marginTop = '100px';
      footer.style.paddingTop = '20px';
      footer.style.borderTop = '1px solid #e0e0e0';
      footer.style.textAlign = 'center';
      footer.style.fontSize = '12px';
      footer.style.color = '#999999';
      footer.textContent = `MULTAs v3 - Medical University Learning and Training Assessment system`;
      pdfContent.appendChild(footer);
      
      // 最初のページ
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // 複数ページの場合
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // PDFダウンロード
      const fileName = `MULTAs_レポート_${currentUser}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      // 一時的な要素を削除
      document.body.removeChild(pdfContent);
      
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDFの生成に失敗しました');
    }
  };

  const renderTabContent = () => {
    // 必要な状態が初期化されていない場合は読み込み中を表示
    if (!isClient) {
      return (
        <div style={styles.emptyState}>
          <p>読み込み中...</p>
        </div>
      );
    }
    
    // postsが配列でない場合のデバッグ
    if (!Array.isArray(posts)) {
      console.error('posts is not an array:', posts);
      return (
        <div style={styles.emptyState}>
          <p>エラー: データの読み込みに失敗しました</p>
          <p style={{ fontSize: '12px' }}>posts: {JSON.stringify(posts)}</p>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'LOG':
        return (
          <>
            {/* 投稿リスト */}
            <main style={styles.main} ref={mainRef}>
              {!isClient ? (
                <div style={styles.emptyState}>
                  <p>読み込み中...</p>
                </div>
              ) : (posts || []).filter(p => p && !p.isElement).length === 0 ? (
                <div style={styles.emptyState}>
                  <p>📝</p>
                  <p>まだ記録がありません</p>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    実習で体験したことを記録しましょう
                  </p>
                </div>
              ) : (
                <div style={styles.postList}>
                  {(posts || []).filter(post => post && !post.isElement).map(post => (
                    <div key={post.id} style={styles.post}>
                      {editingPost === post.id ? (
                        // 編集モード
                        <div style={styles.editContainer}>
                          <textarea
                            style={styles.editTextarea}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            autoFocus
                          />
                          <div style={styles.editButtons}>
                            <button
                              style={styles.saveButton}
                              onClick={() => handleEdit(post.id)}
                              disabled={loading || !editText.trim()}
                            >
                              保存
                            </button>
                            <button
                              style={styles.cancelButton}
                              onClick={() => {
                                setEditingPost(null);
                                setEditText('');
                              }}
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        // 表示モード
                        <>
                          <div style={styles.postHeader}>
                            <div style={styles.postText}>
                              {post.text}
                            </div>
                            <div style={styles.postActions}>
                              <button
                                style={styles.iconButton}
                                onClick={() => {
                                  setEditingPost(post.id);
                                  setEditText(post.text);
                                }}
                                title="編集"
                              >
                                ✏️
                              </button>
                              <button
                                style={styles.iconButton}
                                onClick={() => setDeleteConfirmId(post.id)}
                                title="削除"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <div style={styles.postFooter}>
                            <span style={styles.timestamp}>
                              {post.timestamp}
                              {post.edited && ` (編集済: ${post.editedAt})`}
                              {post.username && ` - ${post.username}`}
                            </span>
                            <span style={styles.categoryTag}>
                              {getCategoryName(post.category)}
                            </span>
                          </div>
                        </>
                      )}
                      
                      {/* 削除確認ダイアログ */}
                      {deleteConfirmId === post.id && (
                        <div style={styles.deleteConfirm}>
                          <p>本当に削除しますか？</p>
                          <div style={styles.confirmButtons}>
                            <button
                              style={styles.deleteButton}
                              onClick={() => handleDelete(post.id)}
                            >
                              削除
                            </button>
                            <button
                              style={styles.cancelButton}
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </main>

            {/* 入力フォーム（LOG画面のみ） */}
            <div style={styles.inputContainer}>
              <textarea
                style={styles.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="実習で体験したことを入力..."
                disabled={loading}
              />
              <button
                style={{
                  ...styles.button,
                  opacity: loading || !text.trim() ? 0.5 : 1
                }}
                onClick={handleSubmit}
                disabled={loading || !text.trim()}
              >
                {loading ? '送信中...' : '送信'}
              </button>
            </div>
          </>
        );

      case 'LIST':
        return (
          <main style={styles.mainWithoutInput}>
            <h2 style={styles.sectionTitle}>分類別リスト</h2>
            {Object.keys(groupedPosts).length === 0 ? (
              <div style={styles.emptyState}>
                <p>まだ記録がありません</p>
              </div>
            ) : (
              <div style={styles.categoryList}>
                {Object.entries(groupedPosts).sort((a, b) => a[0] - b[0]).map(([category, posts]) => (
                  <div key={category} style={styles.categoryGroup}>
                    <h3 style={styles.categoryTitle}>
                      {getCategoryName(category)} ({posts.length}件)
                    </h3>
                    {posts.map(post => (
                      <div key={post.id} style={styles.listItem}>
                        <div style={styles.listItemContent}>
                          <div style={styles.listItemText}>{post.text}</div>
                          {/* AI分類理由は非表示
                          <div style={styles.listItemReason}>{post.reason}</div>
                          */}
                        </div>
                        <button
                          style={styles.shareButton}
                          onClick={() => setShareConfirmPost(post)}
                          title="みんなの学びとしてシェア"
                        >
                          🔗
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </main>
        );

      case 'REPORT':
        const reportPosts = getFilteredPostsForReport();
        const reportCategoryCounts = {};
        for (let i = 1; i <= 12; i++) {
          reportCategoryCounts[i] = reportPosts.filter(p => p.category === i).length;
        }
        
        return (
          <main style={styles.mainWithoutInput}>
            {/* 日付セレクター */}
            <div style={styles.dateSelector}>
              <label style={styles.dateSelectorLabel}>レポート期間：</label>
              <select
                style={styles.dateSelectorDropdown}
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              >
                <option value="practice">練習日</option>
                <option value="1">1日目 (7/28)</option>
                <option value="2">2日目 (7/29)</option>
                <option value="3">3日目 (7/30)</option>
                <option value="4">4日目 (7/31)</option>
                <option value="5">5日目 (8/1)</option>
                <option value="all">全期間 (1-5日)</option>
              </select>
            </div>
            
            <div style={styles.statsContainer}>
              {reportPosts.length > 0 && (
                <RadarChart posts={reportPosts} />
              )}
              
              <div style={styles.statCard}>
                <h3>総記録数</h3>
                <p style={styles.statNumber}>{reportPosts.length}</p>
              </div>
              
              <div style={styles.categoryStats}>
                <h3>カテゴリ別集計ランキング</h3>
                <div style={{ marginTop: '15px' }}>
                  {Object.entries(reportCategoryCounts)
                    .filter(([cat, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count], index) => (
                    <div key={cat} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      borderBottom: '1px solid #e0e0e0',
                      gap: '15px'
                    }}>
                      <span style={{
                        fontWeight: 'bold',
                        fontSize: '18px',
                        color: '#007AFF',
                        minWidth: '40px'
                      }}>{index + 1}位</span>
                      <span style={{
                        flex: 1,
                        fontSize: '16px'
                      }}>{getCategoryName(cat)}</span>
                      <span style={{
                        fontWeight: 'bold',
                        fontSize: '18px',
                        color: '#333'
                      }}>{count}pt</span>
                    </div>
                  ))}
                </div>
              </div>

                            
              
              {/* PDF出力ボタン */}
              {displayPosts.length > 0 && (
                <div style={styles.pdfSection}>
                  <button
                    style={styles.pdfButton}
                    onClick={generatePDF}
                  >
                    📥 PDFでダウンロード
                  </button>
                  <p style={styles.pdfNote}>
                    ※現在表示中のレポートをPDF化します
                  </p>
                </div>
              )}
            </div>
          </main>
        );
        
      case 'みんな':
        return (
          <main style={styles.mainWithoutInput}>
            <h2 style={styles.sectionTitle}>みんなの学び</h2>
            {sharedPosts.length === 0 ? (
              <div style={styles.emptyState}>
                <p>🤝</p>
                <p>まだシェアされた投稿がありません</p>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  LISTタブから投稿をシェアできます
                </p>
              </div>
            ) : (
              <div style={styles.sharedList}>
                {sharedPosts.map(post => {
                  const isMyPost = post.sharedBy === currentUser || post.userName === currentUser;
                  const isLiked = post.likes && post.likes[currentUser] === true;
                  const likeCount = post.likeCount || 0;
                  
                  return (
                    <div 
                      key={post.id} 
                      style={{
                        ...styles.sharedPost,
                        ...(isMyPost ? styles.mySharedPost : {})
                      }}
                    >
                      <div style={styles.sharedPostHeader}>
                        <span style={styles.sharedCategory}>
                          {getCategoryName(post.category)}
                        </span>
                        <div style={styles.sharedPostMeta}>
                          {isMyPost && <span style={styles.myPostBadge}>自分の投稿</span>}
                          <span style={styles.sharedDate}>
                            {post.date || post.timestamp}
                          </span>
                        </div>
                      </div>
                      <div style={styles.sharedPostText}>{post.text}</div>
                      <div style={styles.sharedPostFooter}>
                        <button
                          style={{
                            ...styles.likeButton,
                            ...(isLiked ? styles.likedButton : {})
                          }}
                          onClick={() => handleLike(post.id)}
                        >
                          {isLiked ? '❤️' : '🤍'} {likeCount}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        );
    }
  };

  // ログイン画面
  if (showLogin) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h1 style={styles.loginTitle}>MULTAs v3.3</h1>
          <p style={styles.loginSubtitle}>医学部実習記録システム</p>
          
          <div style={styles.loginForm}>
            <label style={styles.loginLabel}>お名前を入力してください</label>
            <input
              type="text"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="例: 山田太郎"
              style={styles.loginInput}
              autoFocus
            />
            <button
              onClick={handleLogin}
              disabled={!loginName.trim()}
              style={{
                ...styles.loginButton,
                opacity: !loginName.trim() ? 0.5 : 1
              }}
            >
              アプリケーションを開始
            </button>
          </div>
          
          <p style={styles.loginNote}>
            ※名前は他の学生と重複しないようにしてください
          </p>
        </div>
      </div>
    );
  }
  
  // クライアントサイドでない場合は何も表示しない
  if (!isClient) {
    return null;
  }
  
  // ログイン処理中の場合も何も表示しない
  if (!currentUser && !showLogin) {
    return null;
  }

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>MULTAs v3.3</h1>
            <div style={styles.subtitle}>医学部実習記録システム</div>
          </div>
          <div style={styles.userInfo}>
            <span style={styles.username}>👤 {currentUser}</span>
            <button 
              style={styles.logoutButton} 
              onClick={handleLogout}
            >
              ログアウト
            </button>
            <a 
              href="/user-manual" 
              style={styles.helpButton}
              title="使い方ガイド"
            >
              ?
            </a>
          </div>
        </div>
      </header>

      {/* タブナビゲーション */}
      <nav style={styles.tabNav}>
        {tabs.map(tab => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* タブコンテンツ */}
      {renderTabContent()}

      {/* Safari対策の白いスペーサー（LOG画面のみ） */}
      {activeTab === 'LOG' && <div style={styles.safariSpacer} />}
      
      {/* シェア確認ダイアログ */}
      {shareConfirmPost && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmDialog}>
            <h3 style={styles.confirmTitle}>みんなの学びとしてシェアしますか？</h3>
            <div style={styles.confirmContent}>
              <p style={styles.confirmText}>{shareConfirmPost.text}</p>
              <p style={styles.confirmNote}>
                ※シェアされた投稿は他のユーザーも閲覧できます
              </p>
            </div>
            <div style={styles.confirmButtons}>
              <button
                style={styles.confirmButton}
                onClick={() => handleShare(shareConfirmPost)}
              >
                はい
              </button>
              <button
                style={styles.cancelButton}
                onClick={() => setShareConfirmPost(null)}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
  },
  
  header: {
    backgroundColor: '#2196F3',
    color: 'white',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: '15px 20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '800px',
    margin: '0 auto'
  },
  
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold'
  },
  
  subtitle: {
    fontSize: '14px',
    opacity: 0.9,
    marginTop: '4px'
  },

  tabNav: {
    display: 'flex',
    backgroundColor: 'white',
    borderBottom: '1px solid #ddd',
    position: 'fixed',
    top: '80px', // ヘッダーの高さ
    left: 0,
    right: 0,
    zIndex: 90
  },

  tab: {
    flex: 1,
    padding: '12px',
    border: 'none',
    backgroundColor: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#666',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s'
  },

  activeTab: {
    color: '#2196F3',
    borderBottomColor: '#2196F3'
  },
  
  main: {
    flex: 1,
    marginTop: '140px', // ヘッダー + タブ分
    marginBottom: '140px',
    padding: '20px',
    paddingTop: '10px',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch'
  },

  mainWithoutInput: {
    flex: 1,
    marginTop: '140px',
    marginBottom: '20px',
    padding: '20px',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch'
  },

  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333'
  },
  
  emptyState: {
    textAlign: 'center',
    color: '#666',
    marginTop: '60px',
    fontSize: '16px'
  },
  
  postList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  
  post: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  postFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    fontSize: '12px'
  },
  
  categoryTag: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  
  timestamp: {
    color: '#999'
  },
  
  postText: {
    fontSize: '16px',
    lineHeight: '1.5'
  },
  
  postReason: {
    fontSize: '14px',
    color: '#666',
    borderTop: '1px solid #eee',
    paddingTop: '8px',
    marginTop: '8px'
  },

  // LIST画面用スタイル
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },

  categoryGroup: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },

  categoryTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: '12px'
  },

  listItem: {
    borderBottom: '1px solid #eee',
    paddingBottom: '12px',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px'
  },

  listItemContent: {
    flex: 1
  },

  listItemText: {
    fontSize: '15px',
    lineHeight: '1.5',
    marginBottom: '6px'
  },

  listItemReason: {
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic'
  },

  // REPORT画面用スタイル
  statsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },

  statCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },

  statNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#2196F3',
    margin: '10px 0'
  },

  categoryStats: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },

  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginTop: '10px'
  },

  categoryStat: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '14px'
  },

  reportSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },

  reportButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },

  reportNote: {
    fontSize: '14px',
    color: '#666',
    marginTop: '10px'
  },
  
  inputContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTop: '1px solid #ddd',
    padding: '12px',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
    zIndex: 200
  },
  
  textarea: {
    flex: 1,
    minHeight: '60px',
    maxHeight: '120px',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  
  button: {
    padding: '12px 24px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  
  safariSpacer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '120px',
    backgroundColor: 'white',
    zIndex: 150
  },
  
  elementBadge: {
    backgroundColor: '#FF9800',
    color: 'white',
    fontSize: '12px',
    padding: '2px 6px',
    borderRadius: '4px',
    marginRight: '8px',
    fontWeight: 'bold'
  },
  
  generatedReport: {
    backgroundColor: '#E8F5E9',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  reportContent: {
    fontSize: '15px',
    lineHeight: '1.8',
    color: '#333',
    marginTop: '10px',
    whiteSpace: 'pre-wrap'
  },
  
  reportTimestamp: {
    fontSize: '12px',
    color: '#666',
    marginTop: '10px',
    textAlign: 'right'
  },
  
  // 編集・削除機能のスタイル
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px'
  },
  
  postActions: {
    display: 'flex',
    gap: '4px',
    flexShrink: 0
  },
  
  iconButton: {
    background: 'none',
    border: 'none',
    fontSize: '10px',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '4px',
    transition: 'background 0.2s'
  },
  
  editContainer: {
    width: '100%'
  },
  
  editTextarea: {
    width: '100%',
    minHeight: '80px',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #2196F3',
    borderRadius: '8px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  
  editButtons: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    justifyContent: 'flex-end'
  },
  
  saveButton: {
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#ccc',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  
  deleteConfirm: {
    backgroundColor: '#FFF3E0',
    padding: '12px',
    borderRadius: '4px',
    marginTop: '8px',
    fontSize: '14px'
  },
  
  confirmButtons: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px'
  },
  
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#F44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  
  // SHARE画面用スタイル
  shareDescription: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#E3F2FD',
    borderRadius: '8px'
  },
  
  sharedLearnings: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  
  comingSoon: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    color: '#999'
  },
  
  // PDF出力用スタイル
  pdfSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginTop: '20px'
  },
  
  pdfButton: {
    padding: '12px 24px',
    backgroundColor: '#FF5722',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  
  pdfNote: {
    fontSize: '14px',
    color: '#666',
    marginTop: '10px'
  },
  
  // ログイン画面用スタイル
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontSize: '18px',
    color: '#666'
  },
  
  loginBox: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center'
  },
  
  loginTitle: {
    fontSize: '32px',
    color: '#2196F3',
    marginBottom: '8px'
  },
  
  loginSubtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px'
  },
  
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  
  loginLabel: {
    fontSize: '16px',
    fontWeight: 'bold',
    textAlign: 'left'
  },
  
  loginInput: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  
  loginButton: {
    padding: '12px 24px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px'
  },
  
  loginNote: {
    fontSize: '14px',
    color: '#999',
    marginTop: '20px'
  },
  
  // ユーザー情報表示
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  
  daySelector: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
    fontWeight: 'bold'
  },
  
  username: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white'
  },
  
  logoutButton: {
    padding: '4px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  
  helpButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '16px',
    marginLeft: '8px',
    cursor: 'pointer'
  },
  
  // 日付セレクターのスタイル
  dateSelector: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  dateSelectorLabel: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  
  dateSelectorDropdown: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  
  // シェア関連のスタイル
  shareButton: {
    padding: '4px 8px',
    backgroundColor: '#E3F2FD',
    fontSize: '14px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    flexShrink: 0
  },
  
  sharedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  
  sharedPost: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  sharedPostHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
    fontSize: '14px'
  },
  
  sharedPostMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px'
  },
  
  sharedCategory: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  
  sharedDate: {
    color: '#999',
    fontSize: '12px'
  },
  
  sharedPostText: {
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '8px'
  },
  
  sharedPostFooter: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginTop: '12px'
  },
  
  mySharedPost: {
    backgroundColor: '#F3E5F5',
    borderLeft: '4px solid #9C27B0'
  },
  
  myPostBadge: {
    backgroundColor: '#9C27B0',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  
  likeButton: {
    padding: '6px 16px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '20px',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s'
  },
  
  likedButton: {
    backgroundColor: '#FFE0E0'
  },
  
  // 確認ダイアログ
  confirmOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  
  confirmDialog: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '90%',
    width: '400px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  },
  
  confirmTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    textAlign: 'center'
  },
  
  confirmContent: {
    marginBottom: '20px'
  },
  
  confirmText: {
    fontSize: '16px',
    lineHeight: '1.5',
    marginBottom: '12px',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px'
  },
  
  confirmNote: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center'
  },
  
  confirmButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  
  confirmButton: {
    padding: '10px 24px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};