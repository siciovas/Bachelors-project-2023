﻿using AutoMapper;
using LearnProgramming.Core.Commands;
using LearnProgramming.Core.Dto;
using LearnProgramming.Core.Interfaces;
using LearnProgramming.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using LearnProgramming.Core.Dto.DtoUpdate;
using LearnProgramming.Core.Dto.DtoPost;

namespace LearnProgramming.API.Controllers
{
    [ApiController]
    [Route("api")]
    public class UserController : Controller
    {
        private readonly IUserRep _userRepository;
        private readonly IJwtServ _jwt;
        private readonly IMapper _mapper;
        private readonly IHashServ _hashService;

        public UserController(IUserRep userRepository, IJwtServ jwt, IMapper mapper, IHashServ hashService)
        {
            _userRepository = userRepository;
            _jwt = jwt;
            _mapper = mapper;
            _hashService = hashService;
        }

        [HttpPost]
        [Route("register")]
        public async Task<ActionResult> Register(Register register)
        {
            var user = await _userRepository.GetByUsername(register.UserName);

            if (user != null)
            {
                return Conflict(new ErrorDto("Vartotojo vardas užimtas"));
            }

            user = await _userRepository.GetByEmail(register.Email);

            if (user != null)
            {
                return Conflict(new ErrorDto("Vartotojo el. paštas užimtas"));
            }

            var (passwordHash, passwordSalt) = _hashService.HashPassword(register.Password);

            var newUser = new User()
            {
                Id = Guid.NewGuid(),
                UserName = register.UserName,
                Name = register.Name,
                Surname = register.Surname,
                Email = register.Email,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                City = register.City,
                School = register.School,
                Role = Domain.Enums.AllRoles.Student
            };

            await _userRepository.Register(newUser);

            var userDto = _mapper.Map<StudentDto>(newUser);

            return CreatedAtAction(nameof(Register), userDto);
        }

        [HttpPost]
        [Route("login")]
        public async Task<ActionResult<AuthDto>> Login(Login login)
        {
            var user = await _userRepository.GetByUsername(login.UsernameOrEmail);

            if (user == null)
            {
                user = await _userRepository.GetByEmail(login.UsernameOrEmail);

                if (user == null)
                {
                    return NotFound("Tokia paskyra neegzistuoja");
                }
            }

            if (!_hashService.VerifyPassword(login.Password, user.PasswordHash, user.PasswordSalt))
            {
                return BadRequest("Neteisingi duomenys");
            }

            var jwt = _jwt.BuildJwt(user);

            return Ok(new AuthDto(jwt, user.Role));
        }

        [HttpDelete]
        [Authorize]
        [Route("deleteProfile")]
        public async Task<ActionResult> DeleteProfile()
        {
            var user = await _userRepository.GetById(Guid.Parse(User.FindFirstValue(ClaimTypes.Sid)));

            if(user == null)
            {
                return NotFound();
            }

            await _userRepository.DeleteProfile(user);

            return NoContent();
        }

        [Authorize]
        [HttpGet]
        [Route("me")]
        public async Task<ActionResult<UserDto>> Me()
        {
            var user = await _userRepository.GetById(Guid.Parse(User.FindFirstValue(ClaimTypes.Sid)));

            var userDto = _mapper.Map<MeDto>(user);

            return Ok(userDto);
        }

        [HttpPut]
        [Route("updateProfile")]
        [Authorize]
        public async Task<ActionResult<UserUpdateDto>> UpdateMyProfile(UserUpdateDto userDto)
        {
            var user = await _userRepository.GetById(Guid.Parse(User.FindFirstValue(ClaimTypes.Sid)));
            if (user == null) return NotFound();

            await _userRepository.UpdateProfile(userDto, user.Id);

            return Ok(userDto);
        }

        [HttpGet]
        [Route("getAvatar")]
        [Authorize]
        public async Task<ActionResult<UserAvatarDto>> GetUserAvatar()
        {
            var user = await _userRepository.GetById(Guid.Parse(User.FindFirstValue(ClaimTypes.Sid)));
            if (user == null) return NotFound();
            
            var userDto = _mapper.Map<UserAvatarDto>(user);

            return Ok(userDto);
        }

        [HttpPut]
        [Route("updatePassword")]
        [Authorize]
        public async Task<ActionResult> UpdatePassword(UserPasswordDto userDto)
        {
            var user = await _userRepository.GetById(Guid.Parse(User.FindFirstValue(ClaimTypes.Sid)));

            if (user == null) return NotFound();

            if (_hashService.VerifyPassword(userDto.OldPassword, user.PasswordHash, user.PasswordSalt))
            {
                if(userDto.NewPassword == userDto.RepeatPassword)
                {
                    var (passwordHash, passwordSalt) = _hashService.HashPassword(userDto.NewPassword);

                    await _userRepository.UpdatePassword(new UserPasswordUpdateDto 
                    { 
                        PasswordHash = passwordHash,
                        PasswordSalt = passwordSalt,
                    }, user.Id);
                  
                }
            }


            return Ok();
        }

        [HttpGet]
        [Route("getUsers")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<ActionResult<List<UserDto>>> GetUsers()
        {
            var users = new List<UserDto>();

            if(User.IsInRole("Admin"))
            {
                 users = await _userRepository.GetAll();
            }

            else if(User.IsInRole("Teacher"))
            {
                 users = await _userRepository.GetAllStudents();
            }

            return Ok(users);
        }

        [HttpGet]
        [Route("getMyStudents")]
        [Authorize(Roles = "Teacher")]
        public async Task<ActionResult<List<TeachersAllStudentsDto>>> GetMyStudents()
        {
            var users = await _userRepository.GetTeacherAllStudents(Guid.Parse(User.FindFirstValue(ClaimTypes.Sid)));

            return Ok(users);
        }

        [HttpDelete]
        [Route("deleteStudent/{id}")]
        [Authorize(Roles = "Teacher")]
        public async Task<ActionResult> DeleteStudent(string id)
        {
            var student = await _userRepository.GetByIdStudent(Guid.Parse(id));

            if(student == null)
            {
                return NotFound();
            }

            await _userRepository.DeleteStudent(student);

            return NoContent();
        }


        [HttpPost]
        [Route("postStudent")]
        [Authorize(Roles = "Teacher")]
        public async Task<ActionResult> PostStudent(StudentPostDto studenDto)
        {
            var student = await _userRepository.GetByIdStudent(Guid.Parse(studenDto.StudentId));

            if (student != null)
            {
                return Conflict();
            }

            var relation = new TeacherAndStudent
            {
                StudentId = Guid.Parse(studenDto.StudentId),
                TeacherId = Guid.Parse(User.FindFirstValue(ClaimTypes.Sid))
            };

            await _userRepository.PostStudent(relation);

            return Ok(relation);
        }
    }
}
