
    function dropTaskToTree(e) {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('text/plain');
      if (!taskId) return;
      
      const task = tasks.find(t => t.id === parseInt(taskId));
      if (task) {
        // Calculate position relative to canvas layer considering scroll
        const layer = document.getElementById('wb-canvas-layer');
        const viewport = document.getElementById('wb-viewport');
        const rect = layer.getBoundingClientRect();
        
        task.x = e.clientX - rect.left;
        task.y = e.clientY - rect.top;
        task.inTree = true;
        
        renderAllViews();
        renderInteractiveWhiteboard();
      }
    }
\n  

    // Global State
    let currentUserRole = 'manager'; // Default role as manager
    let currentDept = '営業事業部';
    let currentStatusFilterInModal = 'in-progress';

    // Viewport Zoom & Pan
    let zoomScale = 1.0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startPanX = 0;
    let startPanY = 0;

    // Drag State (Single & Parent-Child Descendant Dragging)
    let dragType = null; // 'task' or 'marker'
    let dragNodeId = null;
    let dragMarkerInit = null;
    let mouseStartX = 0;
    let mouseStartY = 0;
    
    let initialDraggedPos = { x: 0, y: 0 };
    let initialDescendantPositions = {}; // childId -> {x, y}

    // Initiative Positions State (Draggable Marker Headers)
    let initiativePositions = [
      { init: 'アタックリストの精度向上', x: 260, y: 170 },
      { init: '商談化率の改善', x: 700, y: 170 },
      { init: 'インターン教育フロー確立', x: 1140, y: 170 }
    ];

    // Branching Tree Tasks Data Structure
    let tasks = [
      {
        id: 999,
        dept: '営業事業部',
        initiative: 'アタックリストの精度向上',
        title: '【新規追加テスト】リストの最終確認',
        assignee: '山田 太郎',
        status: 'unstarted',
        progress: 0,
        stickyColor: 'sticky-yellow',
        isRoutine: false,
        isToday: false,
        priority: 'mid',
        type: 'business',
        deadline: '2026-08-05',
        memo: '',
        inTree: false
      },

      {
        id: 1,
        dept: '営業事業部',
        initiative: 'アタックリストの精度向上',
        title: 'ターゲット企業の条件定義とリスト精査',
        assignee: '山田 太郎',
        status: 'completed',
        progress: 100,
        stickyColor: 'sticky-green',
        isRoutine: false,
        isToday: true,
        priority: 'high',
        type: 'business',
        deadline: '2026-07-30',
        memo: '',
        x: 140,
        y: 280
      },
      {
        id: 2,
        dept: '営業事業部',
        initiative: 'アタックリストの精度向上',
        title: '新規リード50社への架電およびメール送付',
        assignee: '山田 太郎',
        status: 'submitted',
        progress: 85,
        stickyColor: 'sticky-yellow',
        isRoutine: true,
        isToday: true,
        priority: 'high',
        x: 60,
        y: 490,
        parentId: 1
      },
      {
        id: 7,
        dept: '営業事業部',
        initiative: 'アタックリストの精度向上',
        title: '業界データベース自動抽出ツールの検証',
        assignee: '鈴木 花子',
        status: 'in-progress',
        progress: 40,
        stickyColor: 'sticky-blue',
        isRoutine: false,
        isToday: false,
        priority: 'mid',
        x: 320,
        y: 490,
        parentId: 1
      },
      {
        id: 3,
        dept: '営業事業部',
        initiative: '商談化率の改善',
        title: '提案用スライド資料のテンプレート改訂',
        assignee: '鈴木 花子',
        status: 'sixty',
        progress: 60,
        stickyColor: 'sticky-purple',
        isRoutine: false,
        isToday: true,
        priority: 'mid',
        x: 700,
        y: 280
      },
      {
        id: 4,
        dept: '営業事業部',
        initiative: '商談化率の改善',
        title: 'ヒアリングシートのフォーマット標準化',
        assignee: '佐藤 健',
        status: 'in-progress',
        progress: 30,
        stickyColor: 'sticky-blue',
        isRoutine: false,
        isToday: false,
        priority: 'mid',
        x: 700,
        y: 490,
        parentId: 3
      },
      {
        id: 5,
        dept: '営業事業部',
        initiative: 'インターン教育フロー確立',
        title: '週次振り返りミーティング用テンプレート作成',
        assignee: '山田 太郎',
        status: 'unstarted',
        progress: 0,
        stickyColor: 'sticky-yellow',
        isRoutine: true,
        isToday: false,
        priority: 'low',
        x: 1140,
        y: 280
      },
      {
        id: 6,
        dept: 'マーケティング事業部',
        initiative: 'SNSリード獲得キャンペーン',
        title: 'X/LinkedIn投稿クリエイティブの制作',
        assignee: '高橋 涼',
        status: 'submitted',
        progress: 90,
        stickyColor: 'sticky-yellow',
        isRoutine: false,
        isToday: true,
        priority: 'high',
        x: 700,
        y: 280
      }
    ];

    const statusMap = {
      'unstarted': { label: '未着手', class: 'unstarted', color: '#94A3B8' },
      'in-progress': { label: '着手', class: 'in-progress', color: '#3B82F6' },
      'sixty': { label: '6割完了', class: 'sixty', color: '#8B5CF6' },
      'submitted': { label: '提出 (承認待)', class: 'submitted', color: '#F59E0B' },
      'completed': { label: '完了', class: 'completed', color: '#10B981' }
    };

    document.addEventListener('DOMContentLoaded', () => {
      initWhiteboardViewport();
      renderAllViews();
      autoLayoutNodes();
    });

    // Initialize Viewport Pan & Group Drag Event Listeners
    function initWhiteboardViewport() {
      const viewport = document.getElementById('wb-viewport');
      if (!viewport) return;

      

      

      window.addEventListener('mousemove', (e) => {
        if (dragType === 'task' && dragNodeId) {
          // Parent-Child Group Dragging Logic for Sticky Notes
          const deltaX = (e.clientX - mouseStartX) / zoomScale;
          const deltaY = (e.clientY - mouseStartY) / zoomScale;

          const mainTask = tasks.find(t => t.id === dragNodeId);
          if (mainTask) {
            mainTask.x = Math.round(initialDraggedPos.x + deltaX);
            mainTask.y = Math.round(initialDraggedPos.y + deltaY);

            const el = document.getElementById(`sticky-node-${mainTask.id}`);
            if (el) {
              el.style.left = mainTask.x + 'px';
              el.style.top = mainTask.y + 'px';
            }

            // Also move all descendant child tasks simultaneously by deltaX/deltaY
            Object.keys(initialDescendantPositions).forEach(childId => {
              const cId = parseInt(childId);
              const childTask = tasks.find(t => t.id === cId);
              const initPos = initialDescendantPositions[cId];

              if (childTask && initPos) {
                childTask.x = Math.round(initPos.x + deltaX);
                childTask.y = Math.round(initPos.y + deltaY);

                const cEl = document.getElementById(`sticky-node-${cId}`);
                if (cEl) {
                  cEl.style.left = childTask.x + 'px';
                  cEl.style.top = childTask.y + 'px';
                }
              }
            });

            drawSvgBranchLines();
          }
        } else if (dragType === 'marker' && dragMarkerInit) {
          // Parent-Child Group Dragging Logic for Initiative Marker Header
          const deltaX = (e.clientX - mouseStartX) / zoomScale;
          const deltaY = (e.clientY - mouseStartY) / zoomScale;

          const mPos = initiativePositions.find(m => m.init === dragMarkerInit);
          if (mPos) {
            mPos.x = Math.round(initialDraggedPos.x + deltaX);
            mPos.y = Math.round(initialDraggedPos.y + deltaY);

            const mEl = document.querySelector(`.wb-marker-node[data-init="${CSS.escape(dragMarkerInit)}"]`);
            if (mEl) {
              mEl.style.left = mPos.x + 'px';
              mEl.style.top = mPos.y + 'px';
            }

            // Move all descendant tasks under this initiative
            Object.keys(initialDescendantPositions).forEach(tId => {
              const taskId = parseInt(tId);
              const task = tasks.find(t => t.id === taskId);
              const initPos = initialDescendantPositions[taskId];

              if (task && initPos) {
                task.x = Math.round(initPos.x + deltaX);
                task.y = Math.round(initPos.y + deltaY);

                const tEl = document.getElementById(`sticky-node-${taskId}`);
                if (tEl) {
                  tEl.style.left = task.x + 'px';
                  tEl.style.top = task.y + 'px';
                }
              }
            });

            drawSvgBranchLines();
          }
        }
      });

      window.addEventListener('mouseup', () => {
        if (isPanning) {
          isPanning = false;
          viewport.style.cursor = 'grab';
        }
        if (dragType) {
          dragType = null;
          dragNodeId = null;
          dragMarkerInit = null;
        }
      });
    }

    // Helper: Recursively find all descendant task IDs under a given task
    function getDescendantTaskIds(parentId) {
      let result = [];
      const children = tasks.filter(t => t.parentId === parentId && t.dept === currentDept);
      children.forEach(c => {
        result.push(c.id);
        result = result.concat(getDescendantTaskIds(c.id));
      });
      return result;
    }

    function updateTransform() { return; 
      const layer = document.getElementById('wb-canvas-layer');
      if (layer) {
        layer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
      }
      document.getElementById('zoom-text').innerText = `${Math.round(zoomScale * 100)}%`;
    }

    function zoomIn() {
      zoomScale = Math.min(2.2, zoomScale + 0.08);
      updateTransform();
    }

    function zoomOut() {
      zoomScale = Math.max(0.4, zoomScale - 0.08);
      updateTransform();
    }

    function resetZoomPan() {
      zoomScale = 1.0;
      panX = 0;
      panY = 0;
      updateTransform();
      autoLayoutNodes();
    }

    // Multi-branching Auto-Arrange Tree Layout Algorithm
    function autoLayoutNodes() {
      const deptTasks = tasks.filter(t => t.dept === currentDept);
      const initiatives = Array.from(new Set(deptTasks.map(t => t.initiative)));

      if (initiatives.length === 0) return;

      const totalCols = initiatives.length;
      const colWidth = 460;
      const startX = 700 - ((totalCols - 1) * colWidth) / 2;

      initiatives.forEach((init, initIdx) => {
        const posX = startX + initIdx * colWidth;

        // Position Marker Data & DOM
        let mPos = initiativePositions.find(m => m.init === init);
        if (!mPos) {
          mPos = { init: init, x: posX - 100, y: 170 };
          initiativePositions.push(mPos);
        } else {
          mPos.x = posX - 100;
          mPos.y = 170;
        }

        // Position Level 1 Tasks
        const level1Tasks = deptTasks.filter(t => t.initiative === init && !t.parentId);
        const l1Count = level1Tasks.length;
        const l1Spacing = 260;

        level1Tasks.forEach((t, tIdx) => {
          const l1X = posX + (tIdx - (l1Count - 1) / 2) * l1Spacing - 120;
          t.x = l1X;
          t.y = 280;

          // Branch Subtasks Layout
          const children = deptTasks.filter(c => c.parentId === t.id);
          const cCount = children.length;
          const cSpacing = 260;

          children.forEach((c, cIdx) => {
            c.x = l1X + (cIdx - (cCount - 1) / 2) * cSpacing;
            c.y = t.y + 210;
          });
        });
      });

      renderInteractiveWhiteboard();
    }

    function renderAllViews() {
      renderTopPageTable();
      renderInteractiveWhiteboard();
      renderDeptListView();
      renderCalendar();
      renderTimetable();
      renderDrawerTasks();
    }

    function switchNav(sectionId, btn) {
      document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(sectionId).classList.add('active');

      const drawer = document.getElementById('task-drawer');
      const mainContainer = document.querySelector('.main-container');
      
      if (sectionId === 'top-section') {
        if (drawer) drawer.classList.remove('visible');
        if (mainContainer) mainContainer.classList.remove('with-drawer');
        renderTopPageTable();
      } else {
        if (drawer) drawer.classList.add('visible');
        if (mainContainer) mainContainer.classList.add('with-drawer');
        setTimeout(drawSvgBranchLines, 50);
      }
    }

    function selectDepartment(deptName, btn) {
      currentDept = deptName;
      document.querySelectorAll('.dept-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const titleMap = {
        '営業事業部': '「新規顧客獲得数を前月比200%達成し、インターン自走体制を構築する」',
        'マーケティング事業部': '「リード獲得数を前月比150%増・CPAを20%削減する」',
        '開発事業部': '「プロダクトの週次スプリント安定化と新規UIモジュールの提供」'
      };

      document.getElementById('dept-goal-title').innerText = titleMap[deptName] || `「${deptName}の今期目標達成」`;
      document.getElementById('wb-root-text').innerText = `目標：${titleMap[deptName]?.replace(/[「」]/g, '') || deptName}`;
      renderAllViews();
      autoLayoutNodes();
    }

    function switchDeptView(subviewId, btn) {
      document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.dept-subview').forEach(v => v.style.display = 'none');

      btn.classList.add('active');
      document.getElementById(subviewId).style.display = 'block';

      if (subviewId === 'tree-view') {
        setTimeout(drawSvgBranchLines, 50);
      }
    }

    let currentCalendarDate = new Date();
    window.scheduledTasks = window.scheduledTasks || {};

    function renderCalendar() {
      const timeline = document.getElementById('calendar-timeline');
      if (!timeline) return;
      timeline.innerHTML = '';

      const today = new Date();
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
        
        const dayTasks = tasks.filter(t => t.deadline === dateStr);

        let taskHtml = '';
        dayTasks.forEach(t => {
          const typeClass = t.type === 'personal' ? 'personal' : 'business';
          taskHtml += `
            <div class="timeline-task-card ${typeClass}">
              <span>${t.title}</span>
              <span style="color:var(--text-secondary); font-size:0.75rem;">${t.type === 'personal' ? '👤 個人' : '🏢 業務'}</span>
            </div>
          `;
        });

        if (dayTasks.length === 0) {
          taskHtml = `<div style="color:var(--text-secondary); font-size:0.85rem; padding: 8px;">締切が設定されたタスクはありません</div>`;
        }

        const node = document.createElement('div');
        node.className = 'timeline-node';
        node.innerHTML = `
          <div class="timeline-date" onclick="openTimetablePopout('${dateStr}')">
            <div class="timeline-dot"></div>
            <div class="timeline-date-text">${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}</div>
          </div>
          <div class="timeline-tasks">
            ${taskHtml}
          </div>
        `;
        timeline.appendChild(node);
      }
    }

    function openTimetablePopout(dateStr) {
      document.getElementById('popout-date-title').innerText = `${dateStr} のタイムテーブル`;
      document.getElementById('calendar-timetable-popout').classList.add('active');
      currentCalendarDate = dateStr;
      
      if (!window.scheduledTasks[dateStr]) {
        window.scheduledTasks[dateStr] = [];
      }
      
      renderTimetable();
    }

    function closeTimetablePopout() {
      document.getElementById('calendar-timetable-popout').classList.remove('active');
    }

    let isResizingTask = false;
    let isCreatingTask = false;
    let resizingTaskId = null;
    let resizeStartY = 0;
    let resizeStartDuration = 15;
    let createStartY = 0;
    let createEndY = 0;
    let selectionEl = null;

    function getRelativeY(e, container) {
      const rect = container.getBoundingClientRect();
      return e.clientY - rect.top;
    }

    document.addEventListener('mousedown', (e) => {
      // Feature A: Resize
      if (e.target.classList.contains('resize-handle')) {
        e.stopPropagation();
        isResizingTask = true;
        resizingTaskId = e.target.closest('.absolute-task').getAttribute('data-id');
        resizeStartY = e.clientY;
        const taskObj = window.scheduledTasks[currentCalendarDate].find(t => t.id === resizingTaskId);
        resizeStartDuration = taskObj.duration || 15;
        return;
      }
      
      // Feature B: Create
      const dropArea = e.target.closest('.time-drop-area');
      if (dropArea && !e.target.closest('.absolute-task') && !isCreatingTask) {
        isCreatingTask = true;
        const container = document.getElementById('timetable-relative-container');
        createStartY = getRelativeY(e, container);
        createEndY = createStartY;
        
        selectionEl = document.createElement('div');
        selectionEl.className = 'drag-selection';
        selectionEl.style.top = createStartY + 'px';
        selectionEl.style.height = '0px';
        container.appendChild(selectionEl);
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isResizingTask) {
        const deltaY = e.clientY - resizeStartY;
        const deltaMins = Math.round(deltaY / 2); // 2px = 1min
        let newDuration = resizeStartDuration + deltaMins;
        if (newDuration < 15) newDuration = 15;
        
        const taskEl = document.querySelector(`.absolute-task[data-id="${resizingTaskId}"]`);
        if(taskEl) taskEl.style.height = (newDuration * 2) + 'px';
      }
      
      if (isCreatingTask && selectionEl) {
        const container = document.getElementById('timetable-relative-container');
        createEndY = getRelativeY(e, container);
        const top = Math.min(createStartY, createEndY);
        const height = Math.abs(createEndY - createStartY);
        selectionEl.style.top = top + 'px';
        selectionEl.style.height = height + 'px';
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (isResizingTask) {
        const deltaY = e.clientY - resizeStartY;
        const deltaMins = Math.round(deltaY / 2);
        let newDuration = resizeStartDuration + deltaMins;
        if (newDuration < 15) newDuration = 15;
        newDuration = Math.round(newDuration / 15) * 15; // snap to 15m
        
        const taskObj = window.scheduledTasks[currentCalendarDate].find(t => t.id === resizingTaskId);
        if(taskObj) taskObj.duration = newDuration;
        
        isResizingTask = false;
        resizingTaskId = null;
        renderTimetable();
      }
      
      if (isCreatingTask) {
        isCreatingTask = false;
        if (selectionEl) {
          const top = parseInt(selectionEl.style.top);
          const height = parseInt(selectionEl.style.height);
          selectionEl.remove();
          selectionEl = null;
          
          if (height > 5) {
            const startMins = top / 2;
            const durationMins = Math.round(height / 2 / 15) * 15 || 15;
            const snappedStartMins = Math.floor(startMins / 15) * 15;
            
            const totalMins = 5 * 60 + snappedStartMins;
            const h = Math.floor(totalMins / 60);
            const m = totalMins % 60;
            
            const newId = 'sched-' + Date.now();
            if(!window.scheduledTasks[currentCalendarDate]) window.scheduledTasks[currentCalendarDate] = [];
            window.scheduledTasks[currentCalendarDate].push({
              id: newId,
              originalId: null,
              title: '新規タスク',
              h, m, duration: durationMins,
              done: false
            });
            renderTimetable();
            
            setTimeout(() => {
              const input = document.querySelector(`.absolute-task[data-id="${newId}"] input[type="text"]`);
              if(input) {
                input.focus();
                input.select();
              }
            }, 50);
          }
        }
      }
    });

    // Top Page Table
    function renderTopPageTable() {
      const tbody = document.getElementById('top-task-tbody');
      tbody.innerHTML = '';

      // filter business tasks only
      const businessTasks = tasks.filter(t => t.type !== 'personal');

      const sorted = [...businessTasks].sort((a, b) => {
        if (a.status === 'submitted' && b.status !== 'submitted') return -1;
        if (a.status !== 'submitted' && b.status === 'submitted') return 1;
        return 0;
      });

      sorted.forEach(t => {
        const st = statusMap[t.status] || statusMap['unstarted'];
        const tr = document.createElement('tr');
        
        // Highlight logic for Manager view
        if (currentUserRole === 'manager' && t.status === 'submitted') {
          tr.style.backgroundColor = '#FFFBEB';
        } else if (t.status === 'revising') {
          tr.style.backgroundColor = '#FEF2F2'; // light red for revision
        }

        const isRevising = t.status === 'revising';
        const isSubmitted = t.status === 'submitted';

        let actionHtml = '';
        if (currentUserRole === 'manager' && (isSubmitted || isRevising)) {
          actionHtml = `
            <div style="display:flex; gap:6px;">
              <button class="action-btn-primary" style="padding:4px 10px; font-size:0.75rem; background:#10B981;" onclick="approveTask(${t.id})">承認</button>
              <button class="view-mode-btn" style="padding:4px 10px; font-size:0.75rem; border-color:#EF4444; color:#EF4444;" onclick="reviseTask(${t.id})">修正</button>
            </div>
          `;
        }

        tr.innerHTML = `
          <td><strong>${t.dept}</strong></td>
          <td>${t.title}</td>
          <td>${t.assignee}</td>
          <td><span class="status-badge ${isRevising ? '' : st.class}" style="${isRevising ? 'background:#FEE2E2; color:#DC2626;' : ''}">${isRevising ? '修正中' : st.label}</span></td>
          <td>
            ${isRevising ? '<span style="color:#DC2626; font-weight:bold;">修正中</span>' : 
            `<div style="display:flex; align-items:center; gap:8px;">
              <div style="width:70px; height:6px; background:#E2E8F0; border-radius:10px; overflow:hidden;">
                <div style="width:${t.progress}%; height:100%; background:${st.color};"></div>
              </div>
              <span style="font-weight:600; font-size:0.8rem;">${t.progress}%</span>
            </div>` }
          </td>
          <td>${actionHtml}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    function approveTask(id) {
      const task = tasks.find(t => t.id === id);
      if(task) {
        task.status = 'completed';
        task.progress = 100;
        renderAllViews();
      }
    }

    function reviseTask(id) {
      const comment = prompt("修正コメントを入力してください:");
      const task = tasks.find(t => t.id === id);
      if(task) {
        task.status = 'revising';
        // Keep progress as it was, but hide it in UI.
        renderAllViews();
      }
    }

    // Render Whiteboard Canvas
    function renderInteractiveWhiteboard() {
      const container = document.getElementById('wb-nodes-container');
      if (!container) return;
      container.innerHTML = '';

      const deptTasks = tasks.filter(t => t.dept === currentDept && t.inTree !== false);
      const initiatives = Array.from(new Set(deptTasks.map(t => t.initiative)));

      if (initiatives.length === 0) {
        initiatives.push('アタックリストの精度向上', '商談化率の改善');
      }

      // Render Draggable Marker Headers for Key Initiatives
      initiatives.forEach((init, idx) => {
        let mPos = initiativePositions.find(m => m.init === init);
        if (!mPos) {
          mPos = { init: init, x: 260 + idx * 440, y: 170 };
          initiativePositions.push(mPos);
        }

        const mDiv = document.createElement('div');
        mDiv.className = 'wb-marker-node';
        mDiv.id = `wb-marker-${idx}`;
        mDiv.style.left = mPos.x + 'px';
        mDiv.style.top = mPos.y + 'px';
        mDiv.setAttribute('data-init', init);
        mDiv.innerHTML = `<div class="wb-marker-title">施策: ${init}</div>`;

        // Marker Header Group Drag Handler
        mDiv.addEventListener('mousedown', (e) => {
          dragType = 'marker';
          dragMarkerInit = init;
          mouseStartX = e.clientX;
          mouseStartY = e.clientY;
          initialDraggedPos = { x: mPos.x, y: mPos.y };

          // Record initial positions of all tasks in this initiative for group move
          initialDescendantPositions = {};
          deptTasks.filter(t => t.initiative === init).forEach(t => {
            initialDescendantPositions[t.id] = { x: t.x, y: t.y };
          });
          e.stopPropagation();
        });

        container.appendChild(mDiv);
      });

      // Render Draggable Sticky Notes
      deptTasks.forEach(t => {
        const st = statusMap[t.status];
        const note = document.createElement('div');
        note.className = `sticky-note-node ${t.stickyColor || 'sticky-yellow'} ${t.status === 'submitted' ? 'submitted' : ''}`;
        note.id = `sticky-node-${t.id}`;
        note.style.left = (t.x || 300) + 'px';
        note.style.top = (t.y || 300) + 'px';

                note.innerHTML = `
          <div class="sticky-title" onclick="openEditTaskModal(${t.id})">${t.title}</div>
          <div class="sticky-meta" style="justify-content: flex-start; gap: 8px;">
            <span style="font-size: 0.8rem;">締切: ${t.deadline || '未定'}</span>
            <span style="font-weight: bold; color: ${st.color};">${t.progress}%</span>
          </div>
          <div class="sticky-progress-bg">
            <div class="sticky-progress-fill" style="width: ${t.progress}%; background-color: ${st.color};"></div>
          </div>
          <div class="add-subtask-branch-link" onclick="event.stopPropagation(); openAddBranchSubTask(${t.id}, '${t.initiative.replace(/\'/g, "\'")}')">
            ＋ 分岐タスク（子ノード）を追加
          </div>
        `;

        // Parent-Child Descendant Group Drag Handler for Sticky Note
        note.addEventListener('mousedown', (e) => {
          if (e.target.closest('.add-subtask-branch-link') || e.target.closest('.sticky-title')) return;
          dragType = 'task';
          dragNodeId = t.id;
          mouseStartX = e.clientX;
          mouseStartY = e.clientY;
          initialDraggedPos = { x: t.x, y: t.y };

          // Record initial positions of all recursive child tasks
          const descendantIds = getDescendantTaskIds(t.id);
          initialDescendantPositions = {};
          descendantIds.forEach(cId => {
            const childTask = tasks.find(ct => ct.id === cId);
            if (childTask) {
              initialDescendantPositions[cId] = { x: childTask.x, y: childTask.y };
            }
          });
          e.stopPropagation();
        });

        container.appendChild(note);
      });

      setTimeout(drawSvgBranchLines, 50);
    }

    // Dynamic SVG Line Connector Math (Originating from EXACT CENTER-BOTTOM of Root Card)
    function drawSvgBranchLines() {
      const svg = document.getElementById('wb-svg-layer');
      if (!svg) return;
      svg.innerHTML = '';

      const rootNode = document.getElementById('wb-root-node');
      if (!rootNode) return;

      // Exact Center-Bottom of Root Card Node (700px X center, bottom edge Y)
      const rootX = rootNode.offsetLeft + rootNode.offsetWidth / 2;
      const rootY = rootNode.offsetTop + rootNode.offsetHeight;

      const deptTasks = tasks.filter(t => t.dept === currentDept);
      const markerNodes = document.querySelectorAll('.wb-marker-node');

      // Connect Root Goal (Center-Bottom) -> Key Initiative Marker Headers (Center-Top)
      markerNodes.forEach(mNode => {
        const mX = mNode.offsetLeft + mNode.offsetWidth / 2;
        const mY = mNode.offsetTop;
        const initName = mNode.getAttribute('data-init');

        drawCurvePath(svg, rootX, rootY, mX, mY, '#64748B', true, () => {
          openAddTaskForInitiative(initName);
        }, '施策の下にタスクを挿入');

        // Connect Marker Header (Center-Bottom) -> Level 1 Sticky Notes (Center-Top)
        const level1Tasks = deptTasks.filter(t => t.initiative === initName && !t.parentId);
        level1Tasks.forEach(t => {
          const tNode = document.getElementById(`sticky-node-${t.id}`);
          if (tNode) {
            const tX = tNode.offsetLeft + tNode.offsetWidth / 2;
            const tY = tNode.offsetTop;
            const mBottomY = mNode.offsetTop + mNode.offsetHeight;

            drawCurvePath(svg, mX, mBottomY, tX, tY, '#0EA5E9', false, () => {
              openInsertTaskBetween(null, t.id, initName);
            }, '枝に新規タスクを挿入');
          }
        });
      });

      // Connect Parent Sticky Notes (Center-Bottom) -> Child Sticky Notes (Center-Top)
      deptTasks.filter(t => t.parentId).forEach(child => {
        const parent = deptTasks.find(p => p.id === child.parentId);
        if (parent) {
          const pNode = document.getElementById(`sticky-node-${parent.id}`);
          const cNode = document.getElementById(`sticky-node-${child.id}`);

          if (pNode && cNode) {
            const pX = pNode.offsetLeft + pNode.offsetWidth / 2;
            const pY = pNode.offsetTop + pNode.offsetHeight;
            const cX = cNode.offsetLeft + cNode.offsetWidth / 2;
            const cY = cNode.offsetTop;

            drawCurvePath(svg, pX, pY, cX, cY, '#3B82F6', false, () => {
              openInsertTaskBetween(parent.id, child.id, parent.initiative);
            }, '分岐枝にタスクを挿入');
          }
        }
      });
    }

    // Helper: Draw Bezier Curve Line + Interactive Insertion Button (+)
    function drawCurvePath(svg, x1, y1, x2, y2, strokeColor, isDashed, onClickCallback, tooltipText) {
      const midY = (y1 + y2) / 2;
      const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathD);
      path.setAttribute('class', 'branch-path');
      path.setAttribute('stroke', strokeColor);
      if (isDashed) path.setAttribute('stroke-dasharray', '5 3');
      svg.appendChild(path);

      // Midpoint Insertion Button (+)
      const midX = (x1 + x2) / 2;
      
      const gOuter = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      gOuter.setAttribute('class', 'branch-add-node-btn');
      gOuter.setAttribute('transform', `translate(${midX}, ${midY})`);

      const gInner = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      gInner.setAttribute('class', 'branch-add-node-inner');

      const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hitArea.setAttribute('r', '20');
      hitArea.setAttribute('fill', 'transparent');

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '11');
      circle.setAttribute('fill', '#0EA5E9');
      circle.setAttribute('stroke', '#FFFFFF');
      circle.setAttribute('stroke-width', '2');

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', '4.5');
      text.setAttribute('fill', '#FFFFFF');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', 'bold');
      text.textContent = '+';

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = tooltipText || 'クリックしてこの枝にタスクを挿入';

      gInner.appendChild(hitArea);
      gInner.appendChild(circle);
      gInner.appendChild(text);
      gInner.appendChild(title);
      gOuter.appendChild(gInner);

      gOuter.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onClickCallback) onClickCallback();
      });

      svg.appendChild(gOuter);
    }

    // Branch Action Triggers
    function openAddBranchSubTask(parentId, initiativeName) {
      openAddTaskModal();
      const parentTask = tasks.find(t => t.id === parentId);

      document.getElementById('modal-heading').innerText = `「${parentTask ? parentTask.title.slice(0, 12) : ''}...」に分岐子タスクを追加`;
      document.getElementById('modal-task-initiative').value = initiativeName;

      const existingChildren = tasks.filter(t => t.parentId === parentId);
      const childCount = existingChildren.length;
      const offsetX = (childCount % 2 === 0 ? 1 : -1) * Math.ceil(childCount / 2) * 250;

      window.pendingParentId = parentId;
      window.pendingBranchX = (parentTask?.x || 300) + offsetX;
      window.pendingBranchY = (parentTask?.y || 300) + 210;
    }

    function openInsertTaskBetween(parentId, childId, initiativeName) {
      openAddTaskModal();
      document.getElementById('modal-heading').innerText = '枝の間に新しいタスクノードを挿入';
      document.getElementById('modal-task-initiative').value = initiativeName;

      const childTask = tasks.find(t => t.id === childId);
      window.pendingParentId = parentId;
      window.pendingChildId = childId;
      window.pendingBranchX = (childTask?.x || 300);
      window.pendingBranchY = (childTask?.y || 300) - 100;
    }

    // List View
    function renderDeptListView() {
      const tbody = document.getElementById('dept-task-tbody');
      tbody.innerHTML = '';

      const deptTasks = tasks.filter(t => t.dept === currentDept);

      deptTasks.forEach(t => {
        const st = statusMap[t.status];
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color:var(--text-secondary); font-weight:500;">${t.initiative}</td>
          <td><strong>${t.title}</strong></td>
          <td>${t.assignee}</td>
          <td><span class="status-badge ${st.class}">${st.label}</span></td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:60px; height:6px; background:#E2E8F0; border-radius:10px; overflow:hidden;">
                <div style="width:${t.progress}%; height:100%; background:${st.color};"></div>
              </div>
              <span>${t.progress}%</span>
            </div>
          </td>
          <td>${t.isRoutine ? '🔄 ルーティン' : 'ワンショット'}</td>
          <td>
            <button class="view-mode-btn" style="padding:4px 10px; font-size:0.8rem;" onclick="openEditTaskModal(${t.id})">
              編集
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Drawer Control
    function toggleDrawerExpand() {
      const drawer = document.getElementById('task-drawer');
      const btn = document.getElementById('drawer-expand-btn');
      if (drawer.classList.contains('expanded')) {
        drawer.classList.remove('expanded');
        if(btn) btn.innerText = '全画面展開';
      } else {
        drawer.classList.add('expanded');
        if(btn) btn.innerText = '縮小';
        renderDeptListView();
      }
    }

    function renderDrawerTasks() {
      const list = document.getElementById('drawer-task-list');
      if(!list) return;
      list.innerHTML = '';

      const visibleTasks = tasks.filter(t => t.inTree === false);

      visibleTasks.forEach(t => {
        const item = document.createElement('div');
        item.className = 'drawer-task-item';
        item.setAttribute('data-id', t.id);
        
        item.draggable = true;
        item.ondragstart = (e) => {
          e.dataTransfer.setData('text/plain', t.id);
          e.dataTransfer.effectAllowed = 'move';
        };
        item.innerHTML = `
          <div style="font-weight:700; font-size:0.9rem; margin-bottom:4px;">${t.title}</div>
          <div style="font-size:0.75rem; color:var(--text-secondary);">締切: ${t.deadline || '未定'}</div>
        `;
        
        list.appendChild(item);
      });

      // Init Sortable for Drawer with clone mode
      if (window.Sortable) {
        new Sortable(list, {
          group: { name: 'timetable', pull: 'clone', put: false },
          animation: 150,
          sort: false
        });
      }
    }

    // Timetable View
    function renderTimetable() {
      const slotsContainerBg = document.getElementById('timetable-slots-bg');
      const absoluteTasksContainer = document.getElementById('timetable-absolute-tasks');
      if (!slotsContainerBg || !absoluteTasksContainer) return;
      
      // Generate 15-min background slots only once
      if(slotsContainerBg.children.length === 0) {
        let html = '';
        for (let h = 5; h <= 23; h++) {
          for (let m = 0; m < 60; m += 15) {
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const isHour = m === 0;
            html += `
              <div class="time-slot ${isHour ? 'hour-mark' : ''}" data-time="${timeStr}">
                <div class="time-label">${isHour ? timeStr : ''}</div>
                <div class="time-drop-area" id="slot-${h}-${m}">
                </div>
              </div>
            `;
          }
        }
        slotsContainerBg.innerHTML = html;
        initTimetableDND();
      }

      // Render Absolute Tasks
      absoluteTasksContainer.innerHTML = '';

      if (currentCalendarDate && window.scheduledTasks[currentCalendarDate]) {
        window.scheduledTasks[currentCalendarDate].forEach(t => {
          const duration = t.duration || 15;
          const topPx = ((t.h - 5) * 60 + t.m) * 2;
          const heightPx = duration * 2;
          
          const taskEl = document.createElement('div');
          taskEl.className = 'absolute-task';
          taskEl.setAttribute('data-id', t.id);
          taskEl.style.top = topPx + 'px';
          taskEl.style.height = heightPx + 'px';
          
          taskEl.innerHTML = `
            <div class="task-content">
              <input type="text" value="${t.title}" onchange="updateScheduledTaskTitle('${t.id}', this.value)" />
              <div class="task-controls">
                <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleScheduledTaskDone('${t.id}', this.checked)" title="完了" />
                <span style="font-size:0.7rem; cursor:pointer;" onclick="unscheduleTask('${t.id}')">✖</span>
              </div>
            </div>
            <div class="resize-handle"></div>
          `;
          
          // Stop propagation on inputs so dragging doesn't start
          const input = taskEl.querySelector('input[type="text"]');
          if(input) input.addEventListener('mousedown', e => e.stopPropagation());
          const checkbox = taskEl.querySelector('input[type="checkbox"]');
          if(checkbox) checkbox.addEventListener('mousedown', e => e.stopPropagation());
          
          absoluteTasksContainer.appendChild(taskEl);
        });
      }
    }

    function updateScheduledTaskTitle(id, newTitle) {
      if(!currentCalendarDate || !window.scheduledTasks[currentCalendarDate]) return;
      const t = window.scheduledTasks[currentCalendarDate].find(x => x.id === id);
      if(t) t.title = newTitle;
    }

    function toggleScheduledTaskDone(id, isDone) {
      if(!currentCalendarDate || !window.scheduledTasks[currentCalendarDate]) return;
      const t = window.scheduledTasks[currentCalendarDate].find(x => x.id === id);
      if(t) t.done = isDone;
    }

    function unscheduleTask(id) {
      if(!currentCalendarDate || !window.scheduledTasks[currentCalendarDate]) return;
      window.scheduledTasks[currentCalendarDate] = window.scheduledTasks[currentCalendarDate].filter(x => x.id !== id);
      renderTimetable();
    }

    function initTimetableDND() {
      if (!window.Sortable) return;
      const dropAreas = document.querySelectorAll('.time-drop-area');
      dropAreas.forEach(area => {
        new Sortable(area, {
          group: 'timetable',
          animation: 150,
          onAdd: function (evt) {
            const taskId = parseInt(evt.item.getAttribute('data-id'));
            const slotId = area.id.replace('slot-', '').split('-');
            const h = parseInt(slotId[0]);
            const m = parseInt(slotId[1]);
            
            const task = tasks.find(t => t.id === taskId);
            if (task && currentCalendarDate) {
              const newId = 'sched-' + Date.now() + Math.floor(Math.random() * 1000);
              if(!window.scheduledTasks[currentCalendarDate]) window.scheduledTasks[currentCalendarDate] = [];
              window.scheduledTasks[currentCalendarDate].push({
                id: newId,
                originalId: taskId,
                title: task.title,
                h, m,
                duration: 15, // Default 15 mins
                done: false
              });
              
              evt.item.remove();
              setTimeout(renderTimetable, 50); 
            } else {
              evt.item.remove();
            }
          }
        });
      });
    }

    // Modal Control
    function openAddTaskModal() {
      document.getElementById('modal-heading').innerText = '新規付箋タスクの追加';
      document.getElementById('modal-task-id').value = '';
      document.getElementById('modal-task-title').value = '';
      document.getElementById('modal-task-assignee').value = '山田 太郎';
      document.getElementById('modal-task-routine').checked = false;
      window.pendingParentId = null;
      window.pendingChildId = null;
      window.pendingBranchX = null;
      window.pendingBranchY = null;
      setModalStatus('unstarted', 0);
      document.getElementById('task-modal').classList.add('active');
    }

    function openAddTaskForInitiative(initName) {
      openAddTaskModal();
      document.getElementById('modal-task-initiative').value = initName;
    }

    function openEditTaskModal(id) {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      document.getElementById('modal-heading').innerText = '付箋タスクの編集・進捗更新';
      document.getElementById('modal-task-id').value = task.id;
      document.getElementById('modal-task-title').value = task.title;
      document.getElementById('modal-task-initiative').value = task.initiative;
      document.getElementById('modal-task-assignee').value = task.assignee;
      document.getElementById('modal-task-routine').checked = task.isRoutine;
      setModalStatus(task.status, task.progress);

      document.getElementById('task-modal').classList.add('active');
    }

    function closeModal(modalId) {
      document.getElementById(modalId).classList.remove('active');
    }

    function setModalStatus(statusKey, defaultProgress) {
      currentStatusFilterInModal = statusKey;
      const btns = document.querySelectorAll('.status-stage-btn');
      btns.forEach(b => b.classList.remove('selected'));

      const rangeInput = document.getElementById('modal-task-progress-range');
      rangeInput.value = defaultProgress;
      document.getElementById('range-val-display').innerText = defaultProgress + '%';

      const btnIndexMap = { 'unstarted': 0, 'in-progress': 1, 'sixty': 2, 'submitted': 3, 'completed': 4 };
      if (btnIndexMap[statusKey] !== undefined) {
        btns[btnIndexMap[statusKey]].classList.add('selected');
      }
    }

    function saveTaskModal() {
      const idVal = document.getElementById('modal-task-id').value;
      const title = document.getElementById('modal-task-title').value.trim();
      const initiative = document.getElementById('modal-task-initiative').value;
      const assignee = document.getElementById('modal-task-assignee').value;
      const progress = parseInt(document.getElementById('modal-task-progress-range').value);
      const isRoutine = document.getElementById('modal-task-routine').checked;

      if (!title) {
        alert('タスク名を入力してください');
        return;
      }

      const colors = ['sticky-yellow', 'sticky-blue', 'sticky-green', 'sticky-purple'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      if (idVal) {
        const task = tasks.find(t => t.id === parseInt(idVal));
        if (task) {
          task.title = title;
          task.initiative = initiative;
          task.assignee = assignee;
          task.status = currentStatusFilterInModal;
          task.progress = progress;
          task.isRoutine = isRoutine;
        }
      } else {
        const newId = Date.now();

        let defaultX = 300;
        let defaultY = 300;

        const deptTasks = tasks.filter(t => t.dept === currentDept && t.initiative === initiative);
        const initiatives = Array.from(new Set(tasks.filter(t => t.dept === currentDept).map(t => t.initiative)));
        const initIdx = initiatives.indexOf(initiative);
        const totalCols = Math.max(1, initiatives.length);
        const colWidth = 460;
        const startX = 700 - ((totalCols - 1) * colWidth) / 2;

        if (initIdx >= 0) {
          defaultX = startX + initIdx * colWidth - 120;
          defaultY = 280 + deptTasks.length * 190;
        }

        const newTask = {
          id: newId,
          dept: currentDept,
          initiative: initiative,
          title: title,
          assignee: assignee,
          status: currentStatusFilterInModal,
          progress: progress,
          stickyColor: randomColor,
          isRoutine: isRoutine,
          isToday: true,
          priority: 'mid',
          x: window.pendingBranchX || defaultX,
          y: window.pendingBranchY || defaultY,
          parentId: window.pendingParentId || null
        };

        if (window.pendingChildId) {
          const childTask = tasks.find(t => t.id === window.pendingChildId);
          if (childTask) {
            childTask.parentId = newId;
          }
        }

        tasks.push(newTask);
      }

      window.pendingParentId = null;
      window.pendingChildId = null;
      window.pendingBranchX = null;
      window.pendingBranchY = null;

      closeModal('task-modal');
      renderAllViews();
    }

    function deleteCurrentTask() {
      const idVal = document.getElementById('modal-task-id').value;
      if (!idVal) return;

      if (confirm('この付箋タスクを削除してもよろしいですか？')) {
        tasks = tasks.filter(t => t.id !== parseInt(idVal));
        closeModal('task-modal');
        renderAllViews();
      }
    }
  
    function dropTaskToTree(e) {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('text/plain');
      if (!taskId) return;
      
      const task = tasks.find(t => t.id === parseInt(taskId));
      if (task) {
        // Calculate position relative to canvas layer considering scroll
        const layer = document.getElementById('wb-canvas-layer');
        const viewport = document.getElementById('wb-viewport');
        const rect = layer.getBoundingClientRect();
        
        task.x = e.clientX - rect.left;
        task.y = e.clientY - rect.top;
        task.inTree = true;
        
        renderAllViews();
        renderInteractiveWhiteboard();
      }
    }
\n  