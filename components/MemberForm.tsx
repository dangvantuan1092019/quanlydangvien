import React, { useState, useRef, useEffect } from 'react';
import type { PartyMember, TrainingCourse } from '../types';
import { UploadIcon, DownloadIcon, TrashIcon } from './icons';

interface MemberFormProps {
  addMember: (member: PartyMember) => void;
  editingMember: PartyMember | null;
  updateMember: (member: PartyMember) => void;
  onCancelEdit: () => void;
}

const initialFormState: Omit<PartyMember, 'id'> = {
  fullName: '',
  dateOfBirth: '',
  gender: 'Nam',
  position: '',
  politicalTheoryLevel: '',
  partyCardNumber: '',
  admissionDate: '',
  officialDate: '',
  trainingCourses: [],
  profilePicture: undefined,
  ethnicity: '',
  religion: '',
  educationLevel: '',
  idCode: '',
};

const MemberForm: React.FC<MemberFormProps> = ({ addMember, editingMember, updateMember, onCancelEdit }) => {
  const [formData, setFormData] = useState<Omit<PartyMember, 'id'> & { id?: string }>(initialFormState);
  const importFileRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (editingMember) {
      // Ensure trainingCourses is always an array
      setFormData({ ...editingMember, trainingCourses: editingMember.trainingCourses || [] });
    } else {
      setFormData(initialFormState);
    }
  }, [editingMember]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCourseChange = (index: number, field: keyof TrainingCourse, value: string) => {
    const updatedCourses = [...formData.trainingCourses];
    updatedCourses[index] = { ...updatedCourses[index], [field]: value };
    setFormData(prev => ({ ...prev, trainingCourses: updatedCourses }));
  };

  const addCourse = () => {
    setFormData(prev => ({ ...prev, trainingCourses: [...prev.trainingCourses, { name: '', date: '' }] }));
  };

  const removeCourse = (index: number) => {
    setFormData(prev => ({ ...prev, trainingCourses: prev.trainingCourses.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      updateMember(formData as PartyMember);
    } else {
      addMember({ ...formData, id: new Date().toISOString() });
    }
  };
  
  const handleExportJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(formData, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `${formData.fullName?.replace(/\s/g, '_') || 'ho_so_dang_vien'}.json`;
    link.click();
  };
  
  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const text = await file.text();
        const importedData = JSON.parse(text);
        
        // Ensure trainingCourses is an array after import
        if (typeof importedData.trainingCourses === 'string') {
            importedData.trainingCourses = [{ name: importedData.trainingCourses, date: '' }];
        } else if (!Array.isArray(importedData.trainingCourses)) {
            importedData.trainingCourses = [];
        }

        setFormData(prev => ({...prev, ...importedData}));
    } catch(error) {
        console.error("Error importing JSON file:", error);
        alert("File JSON không hợp lệ!");
    } finally {
        if (importFileRef.current) {
            importFileRef.current.value = '';
        }
    }
  };

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{editingMember ? 'Chỉnh sửa thông tin Đảng viên' : 'Thêm mới Đảng viên'}</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <div className="md:col-span-3 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 flex items-center justify-center overflow-hidden">
            {formData.profilePicture ? (
                <img src={formData.profilePicture} alt="Ảnh đại diện" className="w-full h-full object-cover" />
            ) : (
                <span className="text-gray-500">Ảnh 3x4</span>
            )}
            </div>
            <input type="file" id="profilePicture" name="profilePicture" onChange={handleImageChange} accept="image/*" className="hidden"/>
            <label htmlFor="profilePicture" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-md text-sm">
                Tải ảnh đại diện
            </label>
        </div>

        {/* Form Fields */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
          <input type="text" name="fullName" value={formData.fullName || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
          <input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Giới tính</label>
          <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm">
            <option>Nam</option>
            <option>Nữ</option>
            <option>Khác</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Dân tộc</label>
          <input type="text" name="ethnicity" value={formData.ethnicity || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tôn giáo</label>
          <input type="text" name="religion" value={formData.religion || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm"/>
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-700">Mã định danh</label>
          <input type="text" name="idCode" value={formData.idCode || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Trình độ học vấn</label>
          <input type="text" name="educationLevel" value={formData.educationLevel || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Chức vụ</label>
          <input type="text" name="position" value={formData.position || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Trình độ lý luận chính trị</label>
          <input type="text" name="politicalTheoryLevel" value={formData.politicalTheoryLevel || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Số thẻ đảng</label>
          <input type="text" name="partyCardNumber" value={formData.partyCardNumber || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Ngày kết nạp đảng</label>
          <input type="date" name="admissionDate" value={formData.admissionDate || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Ngày chính thức vào đảng</label>
          <input type="date" name="officialDate" value={formData.officialDate || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm"/>
        </div>
        
        {/* Training Courses */}
        <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Các lớp được bồi dưỡng</label>
            <div className="space-y-4">
                {formData.trainingCourses.map((course, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-md border">
                        <div className="flex-grow">
                            <label className="text-xs text-gray-600">Tên lớp học</label>
                            <input
                                type="text"
                                value={course.name}
                                onChange={(e) => handleCourseChange(index, 'name', e.target.value)}
                                placeholder="VD: Lớp bồi dưỡng nhận thức về Đảng"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm"
                            />
                        </div>
                        <div className="w-48">
                            <label className="text-xs text-gray-600">Ngày bồi dưỡng</label>
                            <input
                                type="date"
                                value={course.date}
                                onChange={(e) => handleCourseChange(index, 'date', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm"
                            />
                        </div>
                        <button type="button" onClick={() => removeCourse(index)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full self-end mb-1">
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                ))}
            </div>
             <button type="button" onClick={addCourse} className="mt-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md px-4 py-2">
                Thêm lớp bồi dưỡng
            </button>
        </div>

        {/* Actions */}
        <div className="md:col-span-3 flex items-center justify-end space-x-4 mt-4">
            <input type="file" onChange={handleImportJson} className="hidden" ref={importFileRef} accept=".json"/>
            <button type="button" onClick={() => importFileRef.current?.click()} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                <UploadIcon className="h-5 w-5"/>
                Nhập file JSON
            </button>
            <button type="button" onClick={handleExportJson} className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500">
                <DownloadIcon className="h-5 w-5"/>
                Xuất file JSON
            </button>
            {editingMember && (
                <button type="button" onClick={onCancelEdit} className="flex items-center gap-2 rounded-md bg-gray-500 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600">
                    Hủy
                </button>
            )}
            <button type="submit" className="flex items-center gap-2 rounded-md bg-brand-red px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-red-dark">
                {editingMember ? 'Cập nhật' : 'Thêm Đảng viên'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default MemberForm;