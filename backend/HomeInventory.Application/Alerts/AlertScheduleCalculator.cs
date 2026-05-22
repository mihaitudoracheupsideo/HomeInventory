using HomeInventory.Domain.Entities.Alerts;

namespace HomeInventory.Application.Alerts;

public sealed record AlertScheduleWindow(string PeriodKey, DateTime ActiveFromUtc, DateTime DueAtUtc);

public interface IAlertScheduleCalculator
{
    AlertScheduleWindow? GetCurrentWindow(AlertDefinition definition, DateTime nowUtc);
    DateTime? GetNextDueAtUtc(AlertDefinition definition, DateTime fromUtc);
}

public sealed class AlertScheduleCalculator : IAlertScheduleCalculator
{
    public AlertScheduleWindow? GetCurrentWindow(AlertDefinition definition, DateTime nowUtc)
    {
        var dueAtUtc = GetLatestDueAtCandidate(definition, nowUtc);
        if (dueAtUtc == null)
        {
            return null;
        }

        var activeFromUtc = dueAtUtc.Value.AddDays(-definition.LeadTimeDays);
        if (activeFromUtc > nowUtc)
        {
            return null;
        }

        return new AlertScheduleWindow(BuildPeriodKey(dueAtUtc.Value), activeFromUtc, dueAtUtc.Value);
    }

    public DateTime? GetNextDueAtUtc(AlertDefinition definition, DateTime fromUtc)
    {
        var occurrence = GetFirstDueAtUtc(definition);
        if (occurrence == null)
        {
            return null;
        }

        var candidate = occurrence.Value;
        for (var guard = 0; guard < 10000; guard++)
        {
            if (candidate > fromUtc)
            {
                return candidate;
            }

            candidate = GetFollowingDueAtUtc(definition, candidate);
        }

        throw new InvalidOperationException($"Unable to calculate next due date for alert definition {definition.Id}.");
    }

    private DateTime? GetLatestDueAtCandidate(AlertDefinition definition, DateTime nowUtc)
    {
        var occurrence = GetFirstDueAtUtc(definition);
        if (occurrence == null)
        {
            return null;
        }

        DateTime? latestMatch = null;
        var candidate = occurrence.Value;

        for (var guard = 0; guard < 10000; guard++)
        {
            var activeFromUtc = candidate.AddDays(-definition.LeadTimeDays);
            if (activeFromUtc > nowUtc)
            {
                return latestMatch;
            }

            latestMatch = candidate;
            candidate = GetFollowingDueAtUtc(definition, candidate);
        }

        throw new InvalidOperationException($"Unable to calculate current due date for alert definition {definition.Id}.");
    }

    private DateTime? GetFirstDueAtUtc(AlertDefinition definition)
    {
        var firstDate = definition.Frequency switch
        {
            AlertRecurrenceType.Daily => definition.StartDateUtc,
            AlertRecurrenceType.Weekly => GetFirstWeeklyDate(definition),
            AlertRecurrenceType.Monthly => GetFirstMonthlyDate(definition),
            AlertRecurrenceType.Yearly => GetFirstYearlyDate(definition),
            _ => null,
        };

        if (firstDate == null)
        {
            return null;
        }

        return firstDate.Value.ToDateTime(definition.DueTimeUtc, DateTimeKind.Utc);
    }

    private static DateOnly? GetFirstWeeklyDate(AlertDefinition definition)
    {
        var targetDay = definition.DayOfWeek ?? definition.StartDateUtc.DayOfWeek;
        var current = definition.StartDateUtc;
        while (current.DayOfWeek != targetDay)
        {
            current = current.AddDays(1);
        }

        return current;
    }

    private static DateOnly? GetFirstMonthlyDate(AlertDefinition definition)
    {
        var day = definition.DayOfMonth ?? definition.StartDateUtc.Day;
        var year = definition.StartDateUtc.Year;
        var month = definition.StartDateUtc.Month;
        var candidate = BuildClampedDate(year, month, day);
        if (candidate < definition.StartDateUtc)
        {
            var nextMonth = definition.StartDateUtc.AddMonths(definition.Interval);
            candidate = BuildClampedDate(nextMonth.Year, nextMonth.Month, day);
        }

        return candidate;
    }

    private static DateOnly? GetFirstYearlyDate(AlertDefinition definition)
    {
        var month = definition.MonthOfYear ?? definition.StartDateUtc.Month;
        var day = definition.DayOfMonth ?? definition.StartDateUtc.Day;
        var candidate = BuildClampedDate(definition.StartDateUtc.Year, month, day);
        if (candidate < definition.StartDateUtc)
        {
            candidate = BuildClampedDate(definition.StartDateUtc.Year + definition.Interval, month, day);
        }

        return candidate;
    }

    private static DateTime GetFollowingDueAtUtc(AlertDefinition definition, DateTime currentDueAtUtc)
    {
        return definition.Frequency switch
        {
            AlertRecurrenceType.Daily => currentDueAtUtc.AddDays(definition.Interval),
            AlertRecurrenceType.Weekly => currentDueAtUtc.AddDays(definition.Interval * 7),
            AlertRecurrenceType.Monthly => GetNextMonthlyDueAtUtc(definition, currentDueAtUtc),
            AlertRecurrenceType.Yearly => GetNextYearlyDueAtUtc(definition, currentDueAtUtc),
            _ => throw new InvalidOperationException($"Unsupported frequency '{definition.Frequency}'."),
        };
    }

    private static DateTime GetNextMonthlyDueAtUtc(AlertDefinition definition, DateTime currentDueAtUtc)
    {
        var nextMonth = DateOnly.FromDateTime(currentDueAtUtc).AddMonths(definition.Interval);
        var day = definition.DayOfMonth ?? definition.StartDateUtc.Day;
        var nextDate = BuildClampedDate(nextMonth.Year, nextMonth.Month, day);
        return nextDate.ToDateTime(definition.DueTimeUtc, DateTimeKind.Utc);
    }

    private static DateTime GetNextYearlyDueAtUtc(AlertDefinition definition, DateTime currentDueAtUtc)
    {
        var currentDate = DateOnly.FromDateTime(currentDueAtUtc);
        var month = definition.MonthOfYear ?? definition.StartDateUtc.Month;
        var day = definition.DayOfMonth ?? definition.StartDateUtc.Day;
        var nextDate = BuildClampedDate(currentDate.Year + definition.Interval, month, day);
        return nextDate.ToDateTime(definition.DueTimeUtc, DateTimeKind.Utc);
    }

    private static DateOnly BuildClampedDate(int year, int month, int day)
    {
        var clampedDay = Math.Min(day, DateTime.DaysInMonth(year, month));
        return new DateOnly(year, month, clampedDay);
    }

    private static string BuildPeriodKey(DateTime dueAtUtc)
    {
        return dueAtUtc.ToString("yyyyMMdd'T'HHmmss");
    }
}