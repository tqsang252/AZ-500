# Định hướng thiết kế — AZ-500 Exam Practice

## Ba hướng phong cách

| Theme Name | Very Brief Intro | Probability |
|---|---|---:|
| Azure Operations Console | Giao diện điều hành bảo mật với nền xanh than, chỉ báo trạng thái chính xác và cảm giác tập trung như phòng điều khiển. | 0.07 |
| Focused Study Paper | Một không gian học tập sáng, ấm, giàu khoảng thở, lấy cảm hứng từ sổ tay kỹ thuật và các thẻ kiến thức. | 0.03 |
| Signal & Circuit | Không gian kỹ thuật tối giản với các tín hiệu màu rõ ràng, đường liên kết mảnh và nhịp điệu mô-đun. | 0.09 |

## Hướng đã chọn: Azure Operations Console

### Design Movement

Giao diện được định hình theo **enterprise command console** hiện đại: chức năng, trật tự, ít nhiễu và mang sắc thái của Microsoft Azure Security Center, thay vì một trang đố vui thông thường.

### Core Principles

1. **Phân cấp công việc rõ ràng:** Câu hỏi là vùng thao tác chính; điều hướng, tiến trình và giải thích được đặt ở các vùng có vai trò rõ rệt.
2. **Tín hiệu trạng thái thay vì trang trí:** Xanh lam là hành động, xanh lục là đúng/hoàn thành, đỏ là lỗi, vàng là bookmark.
3. **Mật độ có kiểm soát:** Bố cục desktop chia vùng như một bảng điều hành, nhưng trên màn hình nhỏ chuyển thành dòng học tập tuần tự.
4. **Khả dụng và dễ đọc:** Tương phản cao, vùng bấm rộng, trạng thái focus rõ ràng, và mọi phản hồi chấm điểm đều diễn đạt bằng màu lẫn chữ.

### Color Philosophy

Nền **midnight navy** tạo sự tập trung và liên tưởng đến môi trường vận hành Azure. Màu **Azure Signal Blue `#1676E8`** là màu thương hiệu sở hữu, chỉ xuất hiện ở hành động, điều khiển đang hoạt động và điểm cần hướng chú ý. Xanh lục, đỏ, vàng được tiết chế như màu ngữ nghĩa để phản ánh kết quả mà không làm loãng cấu trúc.

### Layout Paradigm

Trên desktop, trang là một **bàn điều khiển ba vùng**: thanh header mảnh chứa chỉ số, sidebar hẹp chứa điều hướng câu hỏi và khung nội dung phân tầng gồm bài làm cùng panel phản hồi. Không sử dụng hero căn giữa; bề mặt được neo theo các đường biên và chiều cao viewport.

### Signature Elements

1. **Lưới số câu hỏi dạng mission control**, với màu trạng thái và chấm bookmark.
2. **Thanh tiến trình phát sáng nhẹ** theo màu Azure Signal Blue.
3. **Nhãn kỷ luật nhỏ bằng chữ hoa**, làm cột mốc cho từng vùng chức năng.

### Interaction Philosophy

Tương tác phải ngay lập tức và có mục đích: chọn đáp án tạo tín hiệu chọn gọn, chấm đáp án mở phản hồi trong cùng vị trí, bookmark đổi trạng thái trực quan. Các thao tác điều hướng không làm mất lựa chọn đã lưu.

### Animation

Chuyển động giới hạn trong 120–220 ms với `cubic-bezier(0.23, 1, 0.32, 1)`: nút bấm thu nhỏ nhẹ khi nhấn, panel giải thích hiện bằng opacity/transform, modal kết quả nổi vào từ `scale(0.96)` và opacity 0. Người dùng chọn giảm chuyển động sẽ không thấy hiệu ứng không thiết yếu.

### Typography System

**Sora** dùng cho thương hiệu, tiêu đề và số liệu với trọng số 600–750; **Source Sans 3** dùng cho câu hỏi, lựa chọn và nội dung tham chiếu để đọc lâu không mỏi mắt. Nhãn chức năng dùng cỡ nhỏ, chữ hoa và khoảng cách ký tự rộng.

### Brand Essence

**AZ-500 Exam Practice là bảng điều khiển tập trung dành cho người học muốn chuyển kiến thức bảo mật Azure thành kết quả thi có thể đo lường.** Tính cách: **chính xác, vững vàng, tập trung**.

### Brand Voice

Giọng điệu trực tiếp, kỹ thuật, khuyến khích nhưng không khoa trương. Headline ưu tiên động từ hành động và số liệu rõ ràng; microcopy mô tả chính xác trạng thái.

> Ví dụ: “Xác minh lựa chọn của bạn.”
>
> Ví dụ: “Bạn đã hoàn thành 18 trên 40 câu — tiếp tục giữ nhịp.”

### Wordmark & Logo

Biểu trưng là **khiên Azure được tạo bởi ba mặt phẳng phân lớp**, có một dấu tick âm ở tâm; không kèm chữ trong chính biểu tượng. Wordmark “AZ-500” dùng chữ Sora đậm, khoảng cách ký tự chặt; “EXAM PRACTICE” là nhãn phụ có tracking rộng.

### Signature Brand Color

**Azure Signal Blue — `#1676E8`**.

## Style Decisions

- Lưới câu hỏi là ma trận mission-control trực quan, hiển thị trạng thái đã trả lời, đang xem và bookmark ngay trong sidebar.
- Azure Signal Blue là accent phi ngữ nghĩa duy nhất; xanh lục, đỏ và vàng chỉ biểu thị trạng thái đúng, sai và bookmark.
- Toàn bộ điều khiển vận hành dùng tiếng Anh ngắn gọn và theo giọng điệu exam operations console.
- Lockup thương hiệu cố định là **AZ-500 / EXAM PRACTICE**; các bề mặt console dùng midnight navy phẳng, divider rõ và Azure Signal Blue chỉ dành cho trạng thái hoạt động/xác minh.
- Copy tiện ích ưu tiên các động từ vận hành như **Verify**, **Review**, **Flag**, **Resume** và **Complete**; các panel phụ hỗ trợ, không cạnh tranh với câu hỏi đang làm.
