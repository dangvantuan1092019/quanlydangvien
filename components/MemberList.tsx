
import React, { useRef, useState } from 'react';
import type { PartyMember } from '../types';
import { DownloadIcon, UploadIcon, EditIcon, TrashIcon } from './icons';

// Declare XLSX as a global variable to satisfy TypeScript since it's loaded from a CDN
declare const XLSX: any;

interface MemberListProps {
  members: PartyMember[];
  addMultipleMembers: (members: PartyMember[]) => void;
  onEdit: (member: PartyMember) => void;
  onDelete: (id: string) => void;
}

const calculateAge = (dateOfBirth: string): number | string => {
  if (!dateOfBirth) return 'N/A';
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const MemberList: React.FC<MemberListProps> = ({ members, addMultipleMembers, onEdit, onDelete }) => {
    const importFileRef = useRef<HTMLInputElement>(null);
    const [memberToDelete, setMemberToDelete] = useState<PartyMember | null>(null);

    const handleExportWord = () => {
        const header = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Danh Sách Đảng Viên</title>
            <style>
                body { font-family: 'Times New Roman', serif; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid black; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                h1 { text-align: center; }
            </style>
            </head><body>
            <h1>DANH SÁCH ĐẢNG VIÊN</h1>
        `;
        const footer = "</body></html>";
        const tableContent = `
            <table>
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Họ và tên</th>
                        <th>Tuổi</th>
                        <th>Giới tính</th>
                        <th>Chức vụ</th>
                        <th>Số thẻ đảng</th>
                        <th>Ngày vào đảng chính thức</th>
                    </tr>
                </thead>
                <tbody>
                    ${members.map((member, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${member.fullName}</td>
                            <td>${calculateAge(member.dateOfBirth)}</td>
                            <td>${member.gender}</td>
                            <td>${member.position}</td>
                            <td>${member.partyCardNumber}</td>
                            <td>${member.officialDate ? new Date(member.officialDate).toLocaleDateString('vi-VN') : ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        const source = header + tableContent + footer;
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(source);
        fileDownload.download = 'danh-sach-dang-vien.doc';
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    const handleExportExcel = () => {
        const dataToExport = members.map((member, index) => ({
            'STT': index + 1,
            'Họ và tên': member.fullName,
            'Ngày sinh': member.dateOfBirth,
            'Giới tính': member.gender,
            'Dân tộc': member.ethnicity,
            'Tôn giáo': member.religion,
            'Mã định danh': member.idCode,
            'Trình độ học vấn': member.educationLevel,
            'Chức vụ': member.position,
            'Trình độ lý luận chính trị': member.politicalTheoryLevel,
            'Số thẻ đảng': member.partyCardNumber,
            'Ngày kết nạp': member.admissionDate,
            'Ngày chính thức': member.officialDate,
            'Các lớp bồi dưỡng': Array.isArray(member.trainingCourses) 
                ? member.trainingCourses.map(c => `${c.name}${c.date ? ` (${new Date(c.date).toLocaleDateString('vi-VN')})` : ''}`).join('; ')
                : '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachDangVien");
        XLSX.writeFile(workbook, "danh-sach-dang-vien.xlsx");
    };

    const handleExportTemplate = () => {
        const headers = [
            'Họ và tên',
            'Ngày sinh',
            'Giới tính',
            'Dân tộc',
            'Tôn giáo',
            'Mã định danh',
            'Trình độ học vấn',
            'Chức vụ',
            'Trình độ lý luận chính trị',
            'Số thẻ đảng',
            'Ngày kết nạp',
            'Ngày chính thức',
            'Các lớp bồi dưỡng',
        ];
        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        
        // Set column widths for better readability
        worksheet['!cols'] = [
            { wch: 25 }, // Họ và tên
            { wch: 15 }, // Ngày sinh
            { wch: 10 }, // Giới tính
            { wch: 15 }, // Dân tộc
            { wch: 15 }, // Tôn giáo
            { wch: 15 }, // Mã định danh
            { wch: 20 }, // Trình độ học vấn
            { wch: 20 }, // Chức vụ
            { wch: 25 }, // Trình độ lý luận chính trị
            { wch: 15 }, // Số thẻ đảng
            { wch: 15 }, // Ngày kết nạp
            { wch: 15 }, // Ngày chính thức
            { wch: 30 }, // Các lớp bồi dưỡng
        ];
    
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dữ liệu Đảng viên");
        XLSX.writeFile(workbook, "mau-nhap-lieu-dang-vien.xlsx");
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet) as any[];

                const headerMapping: { [key: string]: keyof PartyMember } = {
                  'Họ và tên': 'fullName',
                  'Ngày sinh': 'dateOfBirth',
                  'Giới tính': 'gender',
                  'Dân tộc': 'ethnicity',
                  'Tôn giáo': 'religion',
                  'Mã định danh': 'idCode',
                  'Trình độ học vấn': 'educationLevel',
                  'Chức vụ': 'position',
                  'Trình độ lý luận chính trị': 'politicalTheoryLevel',
                  'Số thẻ đảng': 'partyCardNumber',
                  'Ngày kết nạp': 'admissionDate',
                  'Ngày chính thức': 'officialDate',
                  'Các lớp bồi dưỡng': 'trainingCourses',
                };
                
                const formatDate = (date: any) : string => {
                    if (!date || !(date instanceof Date)) return '';
                    const tzoffset = date.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().split('T')[0];
                    return localISOTime;
                }

                const newMembers: PartyMember[] = json.map((row: any) => {
                    const member: Partial<PartyMember> = { id: new Date().toISOString() + Math.random() };
                    for (const key in headerMapping) {
                        if (row[key] !== undefined) {
                            const memberKey = headerMapping[key];
                            if(memberKey === 'dateOfBirth' || memberKey === 'admissionDate' || memberKey === 'officialDate') {
                                (member as any)[memberKey] = formatDate(row[key]);
                            } else if (memberKey === 'trainingCourses') {
                                const coursesString = String(row[key]);
                                (member as any)[memberKey] = coursesString ? [{ name: coursesString, date: '' }] : [];
                            }
                            else {
                                (member as any)[memberKey] = String(row[key]);
                            }
                        }
                    }
                    if (!member.fullName) member.fullName = 'Không có tên';
                    if (!member.partyCardNumber) member.partyCardNumber = 'Chưa có số thẻ';
                    if (!member.gender) member.gender = 'Khác';
                    if (!member.trainingCourses) member.trainingCourses = [];

                    return member as PartyMember;
                }).filter(m => m.fullName && m.partyCardNumber && m.fullName !== 'Không có tên');

                if (newMembers.length > 0) {
                    addMultipleMembers(newMembers);
                } else {
                    alert('Không tìm thấy dữ liệu Đảng viên hợp lệ trong file. Vui lòng kiểm tra lại định dạng file.');
                }
            } catch (error) {
                console.error("Error importing Excel file:", error);
                alert('Có lỗi xảy ra khi nhập file. File có thể không đúng định dạng.');
            } finally {
                if (importFileRef.current) {
                    importFileRef.current.value = '';
                }
            }
        };
        reader.readAsBinaryString(file);
    };

    const confirmDelete = () => {
        if (memberToDelete) {
            onDelete(memberToDelete.id);
            setMemberToDelete(null);
        }
    };

  return (
    <>
      <div className="p-8 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Danh sách Đảng viên</h2>
            <div className="flex items-center gap-4 flex-wrap">
                <input type="file" onChange={handleImportExcel} className="hidden" ref={importFileRef} accept=".xlsx, .xls"/>
                <button
                    type="button"
                    onClick={() => importFileRef.current?.click()}
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                    <UploadIcon className="h-5 w-5"/>
                    Nhập từ Excel
                </button>
                <button
                    onClick={handleExportTemplate}
                    className="flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500"
                >
                    <DownloadIcon className="h-5 w-5"/>
                    Tải file mẫu
                </button>
                <button
                    onClick={handleExportExcel}
                    disabled={members.length === 0}
                    className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    <DownloadIcon className="h-5 w-5"/>
                    Xuất ra Excel
                </button>
                <button 
                    onClick={handleExportWord}
                    disabled={members.length === 0}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Xuất file Word
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ảnh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tuổi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chức vụ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số thẻ đảng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày chính thức</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {members.length > 0 ? members.map((member) => (
                <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full object-cover" src={member.profilePicture || `https://picsum.photos/seed/${member.id}/40/40`} alt="" />
                    </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{member.fullName}</div>
                        <div className="text-sm text-gray-500">{member.gender}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{calculateAge(member.dateOfBirth)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.partyCardNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.officialDate ? new Date(member.officialDate).toLocaleDateString('vi-VN') : ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                            <button onClick={() => onEdit(member)} className="text-indigo-600 hover:text-indigo-900" title="Chỉnh sửa">
                                <EditIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => setMemberToDelete(member)} className="text-red-600 hover:text-red-900" title="Xóa">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </td>
                </tr>
                )) : (
                <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">
                        Chưa có Đảng viên nào trong danh sách.
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Xác nhận xóa</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Bạn có chắc chắn muốn xóa Đảng viên <span className="font-bold">{memberToDelete.fullName}</span>? Hành động này không thể được hoàn tác.
                </p>
              </div>
              <div className="items-center px-4 py-3 space-x-4">
                <button
                  onClick={() => setMemberToDelete(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MemberList;