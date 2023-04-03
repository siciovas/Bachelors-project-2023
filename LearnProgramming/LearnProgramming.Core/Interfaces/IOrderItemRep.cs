﻿using LearnProgramming.Domain.Entities;

namespace LearnProgramming.Core.Interfaces
{
    public interface IOrderItemRep
    {
        Task<List<OrderItem>> GetAll(int orderId);
        Task<OrderItem> Create(OrderItem orderItem);
    }
}
