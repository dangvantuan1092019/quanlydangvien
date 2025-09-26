import React, { useMemo } from 'react';
import type { PartyMember } from '../types';
import { DownloadIcon } from './icons';

interface DashboardProps {
  members: PartyMember[];
}

const calculateAge = (dateOfBirth: string): number | null => {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const StatCard: React.FC<{ title: string; data: { name: string; value: number }[] }> = ({ title, data }) => (
  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
    <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">{title}</h4>
    {data.length > 0 ? (
      <table className="w-full text-sm">
        <tbody>
          {data.map(({ name, value }) => (
            <tr key={name} className="border-b border-gray-100 last:border-b-0">
              <td className="py-2 text-gray-600">{name}</td>
              <td className="py-2 text-gray-800 font-semibold text-right">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className="text-gray-500 text-sm py-4 text-center">Không có dữ liệu</p>
    )}
  </div>
);


const Dashboard: React.FC<DashboardProps> = ({ members }) => {

  const stats = useMemo(() => {
    // Gender
    const genderData = members.reduce((acc, member) => {
      const key = member.gender || 'Chưa có';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Age Groups
    const ageGroupData = members.reduce((acc, member) => {
      const age = calculateAge(member.dateOfBirth);
      let group = 'Chưa có';
      if (age !== null) {
        if (age < 30) group = 'Dưới 30';
        else if (age <= 40) group = '30 - 40';
        else if (age <= 50) group = '41 - 50';
        else if (age <= 60) group = '51 - 60';
        else group = 'Trên 60';
      }
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Ethnicity
    const ethnicityData = members.reduce((acc, member) => {
        const key = member.ethnicity || 'Chưa có';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Religion
    const religionData = members.reduce((acc, member) => {
        const key = member.religion || 'Chưa có';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Education Level
    const educationLevelData = members.reduce((acc, member) => {
        const key = member.educationLevel || 'Chưa có';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Political Theory Level
    const politicalLevelData = members.reduce((acc, member) => {
        const key = member.politicalTheoryLevel || 'Chưa có';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const toArray = (data: Record<string, number>) => Object.entries(data).map(([name, value]) => ({ name, value }));

    return {
      total: members.length,
      gender: toArray(genderData),
      ageGroups: toArray(ageGroupData),
      ethnicity: toArray(ethnicityData),
      religion: toArray(religionData),
      educationLevel: toArray(educationLevelData),
      politicalLevel: toArray(politicalLevelData),
    };
  }, [members]);

  const handleExportWord = () => {
    if (members.length === 0) return;

    const statsData = [
      { title: "Giới tính", data: stats.gender },
      { title: "Độ tuổi", data: stats.ageGroups },
      { title: "Dân tộc", data: stats.ethnicity },
      { title: "Tôn giáo", data: stats.religion },
      { title: "Trình độ học vấn", data: stats.educationLevel },
      { title: "Trình độ lý luận chính trị", data: stats.politicalLevel },
    ];
    
    let tableContent = '';
    statsData.forEach(stat => {
        if(stat.data.length > 0) {
            tableContent += `<h3>${stat.title}</h3>
            <table width="100%" border="1" style="border-collapse: collapse; margin-bottom: 20px;">
                <tbody>
                    ${stat.data.map(item => `
                        <tr>
                            <td style="padding: 8px;">${item.name}</td>
                            <td style="padding: 8px; text-align: right;">${item.value}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
        }
    });

    const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Báo Cáo Thống Kê Đảng Viên</title>
        <style>
            body { font-family: 'Times New Roman', serif; }
            h1, h2, h3 { text-align: center; }
        </style>
        </head><body>
        <h1>BÁO CÁO THỐNG KÊ TỔNG HỢP</h1>
        <h2>Tổng số Đảng viên: ${stats.total}</h2>
    `;
    const footer = "</body></html>";
    
    const source = header + tableContent + footer;
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(source);
    fileDownload.download = 'bao-cao-thong-ke-dang-vien.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Bảng Thống Kê Tổng Hợp</h2>
            <button
                onClick={handleExportWord}
                disabled={members.length === 0}
                className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                <DownloadIcon className="h-5 w-5"/>
                Xuất file Word
            </button>
        </div>
        
        <div className="mb-8">
            <div className="bg-brand-red text-white p-4 rounded-lg flex justify-between items-center shadow-md">
                <h3 className="text-xl font-semibold">Tổng số Đảng viên</h3>
                <p className="text-4xl font-bold">{stats.total}</p>
            </div>
        </div>

        {members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Giới tính" data={stats.gender} />
                <StatCard title="Độ tuổi" data={stats.ageGroups} />
                <StatCard title="Dân tộc" data={stats.ethnicity} />
                <StatCard title="Tôn giáo" data={stats.religion} />
                <StatCard title="Trình độ học vấn" data={stats.educationLevel} />
                <StatCard title="Trình độ lý luận chính trị" data={stats.politicalLevel} />
            </div>
        ) : (
            <div className="text-center py-20 text-gray-500">
                <p>Không có dữ liệu để thống kê.</p>
                <p className="text-sm mt-2">Vui lòng thêm Đảng viên để xem báo cáo.</p>
            </div>
        )}
    </div>
  );
};

export default Dashboard;