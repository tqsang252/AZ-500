# Hạng mục bổ sung theo ảnh tham chiếu

- [x] Bổ sung thanh công cụ header: tìm kiếm câu hỏi, nút Random và nút Bookmark tổng quát.
- [x] Bổ sung menu điều hướng ở sidebar: Practice, Bookmarks, Wrong Answers, Search, Statistics và Settings.
- [x] Bổ sung khối tiến độ sidebar dạng vòng tròn, số câu đúng/sai/bookmarked và công tắc Dark Mode.
- [x] Điều chỉnh layout desktop thành ba cột sát hơn với ảnh: sidebar điều hướng, khu vực câu hỏi và panel phản hồi/phụ trợ.
- [x] Bổ sung panel AI Assistant ở cột phải với gợi ý và ô nhập câu hỏi.
- [x] Bổ sung panel My Notes dưới khu vực câu hỏi và lưu nội dung ghi chú cục bộ.
- [x] Kết nối các bộ lọc sidebar/header với trạng thái đã làm, bookmark và câu trả lời sai.
- [x] Kiểm thử cả desktop và mobile sau khi cập nhật.

## Trích xuất bộ đề PDF AZ-500

- [x] Xác định số trang, cấu trúc nội dung và các trang có hình minh họa trong PDF.
- [x] Trích xuất đầy đủ câu hỏi, đáp án, đáp án đúng, giải thích và tài liệu tham khảo có thể đọc được.
- [x] Tạo hình ảnh riêng cho các câu hỏi có sơ đồ hoặc ảnh minh họa, giữ đúng thứ tự nguồn.
- [x] Chuẩn hóa `question_1.json` với trường hình ảnh, lời giải AI có cấu trúc và dữ liệu hiển thị.
- [x] Điều chỉnh giao diện câu hỏi để hiển thị hình ảnh từ JSON.
- [x] Thay AI Assistant bằng nút mở popup giải thích AI dễ đọc, có cấu trúc.
- [x] Kiểm thử JSON, câu có hình ảnh và popup AI trên desktop/mobile.

## Khôi phục và mở rộng Question navigator

- [x] Áp dụng CSS scoped cho khung navigator rộng hơn.
- [x] Giữ lưới 512 câu có vùng cuộn riêng và hit-area dễ bấm.
- [x] Giữ vòng tiến độ, thống kê và trạng thái current/answered/bookmarked rõ ràng.
- [x] Chạy build và kiểm tra desktop/mobile sau khi sửa.
- [x] Lưu checkpoint sau kiểm thử thành công.

Ghi chú: phần CSS bị ghi dở đã được cắt bỏ sau khối hợp lệ trước khi tiếp tục triển khai.

## Mở rộng navigator lên khoảng 40 câu

- [x] Tăng chiều cao viewport của Question navigator lên khoảng 40 câu.
- [x] Giữ 512 câu trong một vùng cuộn riêng, không làm Progress bị đẩy lên.
- [x] Điều chỉnh kích thước hàng/cột để lưới thoáng, không bị dính sát.
- [x] Kiểm thử desktop và mobile sau khi chỉnh sửa.

## Source Exhibit viewer

- [x] Bấm vào exhibit để mở popup xem ảnh lớn.
- [x] Thêm zoom in, zoom out và reset zoom.
- [x] Hỗ trợ kéo ảnh khi đang phóng to.
- [x] Đóng viewer bằng nút Close hoặc phím Escape.
- [x] Kiểm thử viewer trên desktop và mobile.

## Local exhibit asset migration

- [x] Quét tất cả `media[].src` trong `question_1.json` và URL ảnh trong CSS/HTML.
- [x] Tải/copy ảnh về thư mục assets cục bộ với tên file an toàn, không trùng.
- [x] Cập nhật JSON, CSS và HTML sang đường dẫn tương đối.
- [x] Tạo báo cáo thành công/thất bại và hỗ trợ chế độ dry-run.
- [x] Chạy script và kiểm tra JSON sau khi cập nhật.

## Check Answer selection bug

- [x] Kiểm tra dữ liệu câu 20 và giá trị `input.value` thực tế.
- [x] Chuẩn hóa mã đáp án ở cả `options` và `answer`.
- [x] Sửa selector đọc radio/checkbox trước khi validation.
- [x] Kiểm thử câu single-choice, multiple-choice và HOTSPOT.
- [ ] Lưu checkpoint sau khi build thành công.
