# Ghi chú kiểm thử

## 2026-08-15 — Trạng thái ban đầu và lựa chọn đáp án

Trang đã tải thành công bộ dữ liệu `questions_1.json` với bốn câu hỏi. Khi chọn đáp án A ở câu đầu tiên, giao diện cập nhật đúng tiến trình từ **0%** sang **25%**, chỉ số **1/4 đã trả lời**, thanh tiến trình, và trạng thái của nút câu hỏi trong thanh điều hướng. Lựa chọn này sẽ được dùng để kiểm tra tiếp luồng chấm đáp án, lời giải và modal tổng kết.

## 2026-08-15 — Chấm đáp án và tổng kết

Nút **Check Answer** hoạt động đúng: giao diện hiển thị trạng thái **Chính xác**, tô lựa chọn A bằng màu đúng, và xuất hiện phần lời giải cùng liên kết tài liệu Microsoft Learn. Thao tác mở tổng kết đã được gửi từ trình duyệt nhưng modal chưa xuất hiện trong ảnh trạng thái trả về, vì vậy cần xác minh trạng thái dialog trước khi bàn giao.

Truy vấn trạng thái sau thao tác cho thấy phần tử dialog tồn tại, chưa mở (`open: false`) và chưa có nội dung kết quả. Không có lỗi JavaScript nào được ghi nhận trong console, nên bước tiếp theo là kiểm tra lại đường kích hoạt sự kiện submit thay vì giả định lỗi hiển thị.

Kích hoạt sự kiện nộp bài trong môi trường kiểm thử đã tạo nội dung modal và mở dialog thành công. Với một câu đúng trên tổng bốn câu, kết quả hiển thị **25%**, trạng thái **CHƯA ĐẠT**, tổng số đúng/sai/chưa trả lời và ba nút dẫn đến các câu chưa trả lời. Điều này xác nhận thuật toán tổng kết và luồng điều hướng xem lại hoạt động như kỳ vọng.

## 2026-08-15 — Bản cập nhật đối chiếu giao diện tham chiếu

Đã xác minh thanh công cụ mới, menu sidebar, vòng tiến độ và ma trận điều hướng câu hỏi. Lựa chọn câu 4 từ ma trận cập nhật chính xác nội dung bài làm, đánh dấu trạng thái **current** trong lưới, và đồng bộ số thứ tự trên header từ **Question 1 / 4** sang **Question 4 / 4**.

Tìm kiếm từ thanh công cụ với từ khóa `storage` trả về đúng câu 4, đồng thời vẫn duy trì trạng thái của ma trận, sidebar và vùng làm bài. Bản cập nhật cũng đã biên dịch production thành công sau khi thêm các thành phần mới.

## 2026-08-15 — Kiểm tra hình trong PDF AZ-500

Hai trang mẫu của vùng hotspot đã được đọc trực quan. Trang 32 chứa hình hoàn chỉnh của một bài ghép mức rủi ro đăng nhập và phần bắt đầu của câu 50; trang 33 chứa bảng người dùng, chính sách Identity Protection, vùng chọn Yes/No, các đáp án được khoanh, và phần giải thích của câu 50. Các câu dạng hình sẽ được lưu với trang nguồn/hình minh họa để không làm mất thông tin không thể trích xuất bằng văn bản.

## 2026-08-15 — Kiểm tra bộ dữ liệu PDF trong ứng dụng

Ứng dụng đã nạp thành công **512 câu hỏi** từ `question_1.json`. Ma trận câu hỏi cập nhật tổng số 512. Câu 43 dạng drag-drop hiển thị đúng phần mô tả, nhãn **Source Exhibit**, ảnh trang 27 từ PDF và trạng thái AI cho biết có exhibit đi kèm. Điều này xác minh đường dẫn tài sản hình ảnh trong JSON hoạt động trên giao diện.

Nút **Explain this question** đã mở popup AI thành công trên câu 43. Popup trình bày rõ phần tổng quan, ba bước lập luận có đánh số, Exam signal, Review note, số trang nguồn PDF và liên kết tham khảo. Do một số câu trực quan chỉ có đáp án nằm trong hình nguồn, dữ liệu sẽ được hiệu chỉnh để không suy diễn mã đáp án từ văn bản trích xuất không đầy đủ.

## HOTSPOT question 190 repair

The source exhibit is `/home/ubuntu/webdev-static-assets/az500-question-pages/page-187.jpg` (PDF page 187). It contains two independent answer areas. For `Users who can modify the permissions for RG1`, the correct selection is `User1 only` because User1 is Owner. For `Users who can create virtual networks in RG1`, the correct selection is `User1, User2 and User3 only` because Owner, Contributor, and Security Admin can create the resource while User4 has no subscription role.

The working web asset URL is `/manus-storage/page-187_237be972.jpg`; an HTTP HEAD check returned a 307 redirect to the CloudFront asset, confirming availability. `question_1.json` question 190 is now `type: hotspot`, contains two `answer_areas`, structured answers (`permissions=...`, `virtual-networks=...`), and the renderer creates editable select controls for both areas. Production build completed successfully after the JSON and renderer changes. Direct verification URL: `https://3000-iaym9j432i401rk9ckom7-15cdcdd2.us2.manus.computer/?question=190`.

## Source Exhibit viewer

Added a clickable Source Exhibit figure with keyboard activation. The viewer dialog includes a larger image, zoom in/out controls, reset view, wheel zoom, pointer drag/pan, Escape close, and backdrop close. Production build succeeded. Desktop screenshot confirmed the main console remains intact; mobile screenshot confirmed the responsive question workspace remains usable after the viewer addition. Direct question 190 preview still exposes the exhibit and answer areas.
