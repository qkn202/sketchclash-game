# Hogwarts Sketch — Phù Thủy Tranh Tài 🪄🎨

Tựa game vẽ tranh đoán chữ ma thuật thời gian thực phong cách Harry Potter (Hogwarts Theme).

🌐 **Chơi Trực Tiếp Trên Vercel**: [https://sketchclash-game.vercel.app](https://sketchclash-game.vercel.app)
🐙 **Mã Nguồn GitHub**: [https://github.com/qkn202/sketchclash-game](https://github.com/qkn202/sketchclash-game)

## 🌟 Tính Năng Nổi Bật

- 🪄 **4 Chế Độ Chơi Ma Thuật**:
  - **Độc Hành Phép Thuật**: 1 Người vẽ, cả phòng đoán tốc độ.
  - **Song Kiếm Hợp Bích**: 2 Phù thủy cùng vẽ song song trên 1 bảng vẽ theo thời gian thực (nhân đôi điểm thưởng tương trợ).
  - **Đại Hợp Xướng**: Tất cả cùng vẽ gợi ý cho 1 Thám tử duy nhất đoán từ khóa.
  - **Đuổi Hình Bắt Chữ (Rush Draw)**: Tất cả người chơi nhận từ khóa bí mật riêng biệt cùng lúc. Mỗi người vừa vẽ trên bảng riêng vừa soi tranh đoán từ của các đối thủ khác theo thời gian thực. Hỗ trợ tab Soi Tranh, xem phóng to và giữ nét vẽ bền bỉ khi chuyển đổi.
- 🎨 **Bộ Công Cụ Múa Đũa Đỉnh Cao**: 
  - Bảng 28 màu phép thuật, kích thước cọ, bùa tẩy (Eraser), bùa tràn màu (Paint Bucket), Hoàn tác (Undo) / Làm lại (Redo), Bùa nổ xóa bảng (Bombarda Clear).
- 🤖 **Phù Thủy AI (Bot)**:
  - Bot AI tự động múa đũa vẽ vector sinh động (Draco Malfoy, Ron Weasley, Hermione Granger, Luna Lovegood, Harry Potter, v.v.).
  - Bot biết suy luận đoán từ khóa theo thời gian thực.
- 📱 **Tối Ưu Hóa Mobile Toàn Diện**:
  - Giao diện 2 tầng chuẩn app mobile không bị che khuất gợi ý.
  - Ticker đoán trực tiếp, thanh phản ứng emoji nhanh.
  - Chống phóng to tự động trên iOS Safari.
- 🏆 **Đại Tiệc Trao Cúp Nhà Hogwarts**:
  - Bục vinh danh Podium 3 hạng đầu với cúp Nhà (Gryffindor, Slytherin, Ravenclaw, Hufflepuff).
  - Bảng tổng kết điểm chi tiết và nút "Làm Ván Mới (Cùng Phòng)" giữ nguyên thành viên.
- ⚡ **Hạ Tầng Supabase Realtime**: Đồng bộ trạng thái phòng và tọa độ nét vẽ tức thì dưới 50ms.

## 🛠️ Công Nghệ

- **Framework**: React 19 + TypeScript + Vite
- **Realtime Networking**: Supabase Realtime Channel
- **Styling**: Vanilla CSS (Cinzel Typography, Glassmorphism, Hogwarts Palette)
- **Icons**: Lucide React
- **Audio Engine**: Web Audio API Sound Synthesizer

## 🚀 Chạy Cục Bộ

```bash
npm install
npm run dev
```

Truy cập: `http://localhost:5173/`

## 📦 Đóng Gói Production

```bash
npm run build
```
