﻿using LearnProgramming.Core.Interfaces;
using LearnProgramming.Domain.Entities;
using LearnProgramming.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace LearnProgramming.Infrastructure.Repositories
{
    public class OrderRepository : IOrderRep
    {
        private readonly DatabaseContext _db;

        public OrderRepository(DatabaseContext db)
        {
            _db = db;
        }

        public async Task<Order> Create(Order order)
        {
            _db.Add(order);
            await _db.SaveChangesAsync();

            return order;
        }

        public async Task<List<Order>> GetByUserId(Guid userId)
        {
            return await _db.Order
                .Include(orderItem => orderItem.OrderItems)
                .Where(order => order.UserId == userId && order.IsPaid)
                .ToListAsync();
        }

        public async Task<List<Order>> GetAll()
        {
            return await _db.Order
                .Include(orderItem => orderItem.OrderItems)
                .Where(order => order.IsPaid)
                .ToListAsync();
        }
    }
}
