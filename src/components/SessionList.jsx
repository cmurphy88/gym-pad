const SessionList = ({ sessions }) => {
  console.log(sessions)
  return (
    <>
      {sessions.map((session) => {
        console.log(session)
        return <p key={session.id}>{session.name}</p>
      })}
    </>
  )
}

export default SessionList
