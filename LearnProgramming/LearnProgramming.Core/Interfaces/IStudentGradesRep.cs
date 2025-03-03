﻿using LearnProgramming.Core.Dto;
using LearnProgramming.Core.Dto.DtoUpdate;
using LearnProgramming.Domain.Entities;

namespace LearnProgramming.Core.Interfaces
{
    public interface IStudentGradesRep
    {
        Task<StudentGrades> Update(StudentGradesUpdateDto studentGradesDto, int id);
        Task<StudentGrades> Create(StudentGrades studentGrades);
        Task<List<StudentGradesForTeacherDto>> GetAllByTeacher(Guid id);
        Task<List<StudentGrades>> GetAllByStudent(Guid id);
        Task<StudentGrades?> Get(int id);
    }
}
