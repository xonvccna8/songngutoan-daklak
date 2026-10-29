# Dữ liệu, quyền truy cập, quy tắc tính

> **Project Firebase dùng chung với app khác:** tên thật có tiền tố — `users`→`lsn_users`, `classes`→`lsn_classes`, `schools`→`lsn_schools`, `private`→`lsn_private`, `studentStats`→`lsn_studentStats`, `lessons`→`lsn_lessons` (đáp án + ghi chú GV tách riêng ở `lsn_lessons/{id}/teacher/{slideId}`), `sessions`→`lsn_sessions` (câu trả lời: `responses/{uid}~{slideId}`, chỉ máy chủ ghi qua `/api/live/answer`) (bộ sưu tập mới cũng phải có `lsn_`). Claims: `role/schoolId/classIds` → `lsnRole/lsnSchool/lsnClasses`. Xem `src/lib/namespace.ts`, `docs/CAI-DAT-FIREBASE.md`.

## Firestore
```
schools/{id}                         name, settings
users/{uid}                          role, displayName, schoolId, classIds[]
classes/{id}                         name, grade, schoolId, teacherIds[], joinCode, settings{thresholds, quietHours, maxAttention}
classes/{id}/students/{uid}          fullName, number, team
private/studentAuth/items/{uid}      pinHash, failedCount, lockedUntil      ← chỉ máy chủ
studentStats/{classId}_{uid}         totalPoints, mathPct, langPct, pronAvg, liveAttended, hwDone, hwLate,
                                     studyDays7, streak, lastActiveAt, engagement, weakTerms[]  ← chỉ máy chủ ghi
lessons/{id}                         title{vi,en}, subtitle, subject, grade, duration, equipment, objectives{4C},
                                     activities[4]{goal,product}, terms[{en,ipa,vi,at}], slideIds[], status (draft|pending|approved),
                                     ownerId (null = tiết mẫu), ownerName, schoolId, sourceId, reviewNote  ← ghi qua API
lessons/{id}/slides/{id}             order, type (content|mcq|number|text|label|speak|final), activity (1–4), title{vi,en},
                                     blocks[{kind,step,…}], question{type,prompt,options,targets,unit,time,skill},
                                     speak{target,time}, phonesDown          ← HS chỉ đọc khi tiết đã duyệt
lessons/{id}/teacher/{slideId}       answer, order[] (kéo nhãn), accept[], show, explain, method, notes[]  ← chỉ GV
terms/{id = termId(en)}              en, ipa, vi, imageUrl, example{en,vi}, readAs, grade, status, lessonIds[],
                                     createdBy, createdByName, schoolId     ← HS chỉ đọc thuật ngữ đã duyệt
sessions/{id}                        lessonId, classId, teacherId, roomCode, status,
                                     state{slideIndex, step, phase(idle|open|locked|reveal), lang, timerEndsAt, calledUid}
sessions/{id}/participants/{uid}     joinedAt, lastSeenAt, visible, leftCount, hiddenMs, raisedHandAt
sessions/{id}/responses/{slideId}_{uid}  value, correct, points, score, transcript, wrongWords[], attempts, answeredAt
assignments/{id} (+ /submissions/{uid})  classId, items[], dueAt / openedAt, completedAt, activeSeconds, score
studyDaily/{uid}_{yyyymmdd}          activeSeconds, activities
messages/{id} (+ /receipts/{uid})    classId, fromUid, toUids[]|toTeam|toClass, kind, text{vi,en} / deliveredAt, readAt, ackAt, reply
fcmTokens/{uid}/tokens/{token}
events/{id}                          uid, classId, kind (live|hw|hw_done|speak|cards|praise|streak|levelup), scope (class|home),
                                     xp, at, day, week, note, from/to  ← chỉ máy chủ ghi (src/lib/server/xp.ts)
weekly/{classId}_{yyyy-Www}          classId, week, rows{uid: {c, h}}  ← điểm thi đua tuần; chỉ GV lớp đọc
studentStats (thêm GĐ 3 mới)         xp, level (0–23), levelPrev, levelUpAt, today{day,home,cards}, termsLearned, termsAvail, speakGood
studentStats (thêm GĐ 4)             mastery{idYCCĐ: {a, c, t}} (Sao thành thạo), prepped{idBàiSGK: ms}
resources/{id}                       kind (geogebra|video|worksheet|web), title{vi,en}, url, grade, curLessonId, note, status, createdBy  ← ghi qua API; HS chỉ đọc đã duyệt
classes (thêm GĐ 4)                  curLessonId (bài SGK lớp đang học) · lessons: curLessonId · slides: outcomeIds[]
games/{id}                           GĐ 5 — sessionId, classId, mode (arena|bell|boat|match), pace (self|teacher), settings, status,
                                     questions[] (KHÔNG có đáp án), cur, reveal, powerPlayUntil, podium  ← HS lớp + GV đọc
games/{id}/live/board                rows{uid:{s,st,best,c,n,team,out,done}}, stats{qi:{a,c,pick}}, ev  ← chỉ GV lớp (tivi + laptop)
games/{id}/players/{uid}             order, pos, phase, answers, s, st, inv (power-up), fx, last (kết quả + hạng ▲▼)  ← chính em + GV
games/{id}/private/key               đáp án  ← chỉ máy chủ · sessions: gameId (trận đang mở trong tiết)
```
Trò chơi: máy chủ chấm + tính giờ (`src/lib/server/games.ts`); điểm kiểu Quizizz 600 + tốc độ 0–400, chuỗi, song ngữ (`src/lib/games/scoring.ts`). Điện thoại không nghe bảng điểm (nhận hạng qua API) để tiết kiệm lượt đọc. Kết thúc trận → XP "Trên lớp" (điểm ÷ 1000 ≤ 30, tổ thắng +10, kỉ lục +5) + Sao YCCĐ. Thử trọn trận: `npm run test:emulator`.
Khung chương trình (Toán 6–9 KNTT, YCCĐ song ngữ) và thư viện dựng sẵn (khung câu, câu lệnh lớp học, kí hiệu) nằm trong mã nguồn: `src/lib/curriculum`, `src/lib/library` — không tốn lượt đọc Firestore. Id bài "k8-15", id YCCĐ "k8-15-1".

## Security rules
Mặc định từ chối. Quyền theo custom claims. `private/**` không client nào đọc/ghi. GV chỉ lớp có mình trong `teacherIds`. `sessions`: GV ghi `state`, HS chỉ đọc. `responses`: HS chỉ ghi tài liệu của mình, khi `phase=="open"` và đúng trang, **không ghi `correct`, `points`**. `participants`/`receipts`: HS chỉ ghi của mình (receipts chỉ 4 trường). `messages`: chỉ GV tạo. `studentStats`: chỉ máy chủ ghi. Giới hạn độ dài chuỗi (trả lời ≤300, tin ≤500). Mỗi quy tắc có test cho phép + từ chối (Emulator).

## Trạng thái học
Trong tiết (heartbeat 15 s, chỉ ghi khi đổi trạng thái hoặc mỗi 30 s):
Chưa vào · Đang theo dõi (trang hiển thị, heartbeat ≤45 s) · Đã trả lời · Chưa trả lời (câu mở >30 s) · Rời trang (`visibilitychange`) · Mất kết nối (>45 s không heartbeat).
Ngoài giờ (7 ngày): Tích cực (≥3 ngày học, không trễ) · Cần nhắc (1–2 ngày hoặc trễ 1 bài) · Chưa học (0 ngày hoặc trễ ≥2). Ngưỡng chỉnh trong cài đặt lớp.
Thời gian học chỉ tính khi trang hiển thị và có tương tác trong 60 s gần nhất. Ngày học = ≥5 phút học thật hoặc ≥1 hoạt động.

## Tính điểm
Đúng: 100 + thưởng tốc độ (tối đa 50, giảm 4 theo mỗi thứ hạng đúng). Luyện nói: điểm cao nhất 0–100. Chấm do máy chủ hoặc trình duyệt GV; điểm phát âm GĐ đầu do điện thoại gửi (ghi rõ hạn chế).

## XP, cấp độ, thi đua tuần (GĐ 3 mới)
Điểm trong tiết / bài về nhà (ở trên) vẫn giữ để chấm. **XP** là thước đo tiến bộ chung, chỉ cộng qua `awardXp` (1 transaction: sự kiện + thống kê + bảng tuần; `key` cố định chống cộng trùng). Bảng tích XP, giới hạn 200 XP/ngày ở nhà: `src/lib/progress/xp.ts`. 8 hạng × 3 bậc + điều kiện lên hạng: `src/lib/progress/levels.ts`. `totalPoints` cũ không cộng thêm nữa; tổng XP = `xp` + `totalPoints ÷ 10`. Tuần bắt đầu 0:00 thứ Hai giờ VN.

## Seed
Trường "THCS Mẫu", 2 GV, lớp 7A 30 HS (4 tổ, PIN in ra file), tiết Tam giác cân 12 trang lấy từ bản thử, 9 thuật ngữ, điểm giả lập 3 tuần (đánh dấu dữ liệu mẫu, có lệnh xóa).
